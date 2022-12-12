const DEBUG = true;
let caster_actor;
if (canvas.tokens.controlled.length > 0) {
    caster_actor = canvas.tokens.controlled[0].actor;
} else {
    ui.notifications.warn("No caster selected!");
    return;
}

let result = await warpgate.crosshairs.show(
    config = {
        size: 8,
        icon: "icons/svg/target.svg",
        label: "Incinerate Radius",
        tag: "IncinerateRadius",
        interval: 1,
        fillAlpha: 0.2,
        lockSize: true,
        rememberControlled: true,
    },
    callbacks = {}
);
if (result.cancelled) return;

const incinerate_template_data = {
    t: "circle",
    user: game.user.id,
    distance: (canvas.scene.data.gridDistance) * 4, //radius
    x: result.x,
    y: result.y,
    fillColor: game.user.color,
};
let incinerate_template = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [incinerate_template_data]);
if (DEBUG) console.log(incinerate_template[0].id);

let send_result_to_chat = true;
if (DEBUG) console.log(game.user.targets);
let targets = [];
let target_names = [];
game.user.targets.forEach(token => {
    if (token.actor.data.data.hp.max === null || token.actor.data.data.hp.max === 0) return;
    if (DEBUG) console.log(token);
    targets.push(token.id);
    target_names.push(token.actor.data.name);
});

await Requestor.request({
    whisper: [],
    title: `${caster_actor.data.name} casts Incinerate`,
    img: "icons/magic/fire/beam-jet-stream-yellow.webp",
    footer: target_names,
    buttonData: [{
        label: "Apply Incinerate",
        action: async () => {
            if (!game.user.isGM) {
                ui.notifications.warn("Incinerate can only be applied by a GM.");
                return;
            }
            if (canvas.templates.placeables.find(template => template.id === args.incinerate_template_id) === undefined) {
                ui.notifications.warn("This instance of the Incinerate spell has already been applied.");
                return;
            }
            
            let caster_actor = game.actors.get(args.caster_id);
            if (caster_actor === undefined) {
                ui.notifications.warn("Caster actor undefined.");
                return;
            }
            
            let caster_level;
            if (caster_actor.type === "monster") {
                let hd = caster_actor.data.data.hp.hd;
                if (isNaN(+hd) || (hd = parseInt(hd)) < 1) {
                    ui.notifications.warn("Caster " + caster_actor.data.name + " has improper hit dice set.");
                    return;
                }
                caster_level = hd; // most generic npc casters' level is equal to their hd
            } else {
                caster_level = caster_actor.data.data.details.level;
            }
            
            let tokens = [];
            args.incinerate_targets.forEach(id => {
                let token = canvas.tokens.placeables.find(token => token.id === id);
                if (token !== undefined) tokens.push(token);
            });
            
            let damage_roll = await (new Roll(caster_level + "d8")).roll();
            let damage_render = await damage_roll.render();
            ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker({token: token.document}),
                content: `<span style="float: left;">Damage roll: </span></br>
                            ${damage_render}
                            ` 
            });
            
            const output_msg = async (token, too_strong, died, passed, save_roll, save_val) => {
                let died_status;
                if (passed) {
                    if (died) {
                        died_status = `passed but <b style="color:red;">was consumed by flame.</b>`;
                    } else {
                        died_status = `passed and <b style="color:green;">survived the flames.</b>`;
                    }
                } else {
                    if (died) {
                        died_status = `failed and <b style="color:red;">was consumed by flame.</b>`;
                    } else {
                        died_status = `failed but <b style="color:green;">survived the flames.</b>`;
                    }
                }
                
                let save_status = save_roll === undefined ? "" : 
                    `${token.actor.data.name}'s saving throw (${save_val}): </br>${await save_roll.render()}`;
                
                let chat_message_html = `
                    ${token.actor.data.name} ${died_status}</br>
                    ${save_status}
                    `;
                    
                ChatMessage.create({
                    user: game.user._id,
                    speaker: ChatMessage.getSpeaker({token: token.document}),
                    content: chat_message_html 
                });
            };
            
            tokens.forEach(token => {
                if (token.actor.data.data.hp.value < 1) { // Don't incinerate dead targets
                    return;
                }
                
                let evas_save = token.actor.data.data.saves.evasion.value;
                let new_hp = token.actor.data.data.hp.value;
                (new Roll("1d20")).roll().then(save_roll => { // can't await in forEach, use promise then()
                    const passed = save_roll.total >= evas_save;
                    new_hp -= passed ? Math.floor(damage_roll.total/2) : 
                                       damage_roll.total;
                    output_msg(token, false, new_hp <= 0, passed, save_roll, evas_save);
                    token.actor.update({
                        "data.hp.value": new_hp
                    });
                });
            });
            
            canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [args.incinerate_template_id]);
        },
        incinerate_targets: targets,
        send_to_chat: send_result_to_chat,
        incinerate_template_id: incinerate_template[0].id,
        caster_id: caster_actor.id
    }],
});