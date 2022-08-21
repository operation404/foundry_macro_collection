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
        label: "Smite Radius",
        tag: "SmiteRadius",
        interval: 1,
        fillAlpha: 0.2,
        lockSize: true,
        rememberControlled: true,
    },
    callbacks = {}
);
if (result.cancelled) return;

const smite_template_data = {
    t: "circle",
    user: game.user.id,
    distance: (canvas.scene.data.gridDistance) * 4, //radius
    x: result.x,
    y: result.y,
    fillColor: game.user.color,
};
let smite_template = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [smite_template_data]);
if (DEBUG) console.log(smite_template[0].id);

let send_result_to_chat = true;
if (DEBUG) console.log(game.user.targets);
let targets = [];
let target_names = [];
game.user.targets.forEach(token => {
    if (token.actor.type !== "monster") return;
    if (DEBUG) console.log(token);
    targets.push(token.id);
    target_names.push(token.actor.data.name);
});

await Requestor.request({
    whisper: [],
    title: `${caster_actor.data.name} casts Smite the Dead`,
    img: "icons/magic/death/skeleton-skull-soul-blue.webp",
    footer: target_names,
    buttonData: [{
        label: "Apply Smite the Dead",
        action: async () => {
            if (!game.user.isGM) {
                ui.notifications.warn("Smite the Dead can only be applied by a GM.");
                return;
            }
            if (canvas.templates.placeables.find(template => template.id === args.smite_template_id) === undefined) {
                ui.notifications.warn("This instance of the Smite the Dead spell has already been applied.");
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
                caster_level = Math.max(Math.floor(hd / 2), 1); // min caster level of 1
            } else {
                caster_level = caster_actor.data.data.details.level;
            }
            
            let tokens = [];
            args.smite_targets.forEach(id => {
                let token = canvas.tokens.placeables.find(token => token.id === id);
                if (token !== undefined) tokens.push(token);
            });
            
            let damage_roll = await (new Roll(caster_level + "d10")).roll();
            let damage_render = await damage_roll.render();
            ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker({token: token.document}),
                content: `<span style="float: left;">Damage roll: </span></br>
                            ${damage_render}
                            ` 
            });
            
            
            // TODO has a bug where even when save_render is undefined, it's still
            // printing as if they made a save, which just spits 'undefined' in the
            // chat since there's no roll render
            
            
            
            const output_msg = (token, destroyed, save_render=undefined, save_val=0) => {
                let destroyed_result = destroyed ? 
                                    `<b style="color:red;">was destroyed!</b>` :
                                    `<b style="color:green;">resisted destruction!</b>`;
                console.log(save_render);
                let save_result = destroyed_result === undefined ? 
                                    `${token.actor.data.name} is too strong to be outright destroyed.` :
                                    `<span style="float: left;">${token.actor.data.name}'s saving throw (${save_val}): </span></br> ${save_render}`;
                let chat_message_html = `
                    <span style="float: left;">${token.actor.data.name} ${destroyed_result}</span></br>
                    ${save_result}
                    `;
                ChatMessage.create({
                    user: game.user._id,
                    speaker: ChatMessage.getSpeaker({token: token.document}),
                    content: chat_message_html 
                });
            };
            
            tokens.forEach(token => {
                let hit_die_count = token.actor.data.data.hp.hd;
                if (isNaN(+hit_die_count) || (hit_die_count = parseInt(hit_die_count)) < 1) {
                    ui.notifications.warn(token.actor.data.name + " has improper hit dice set.");
                    return;
                }
                
                if (hit_die_count <= caster_level) {
                    let phys_save = token.actor.data.data.saves.physical.value;
                    
                    // can't use await inside of forEach 
                    (new Roll("1d20")).roll().then(save_roll => {
                        let destroyed = false;
                        
                        if (save_roll.total < phys_save) { // fail
                            token.actor.update({
                                "data.hp.value": 0
                            });
                            destroyed = true;
                        } else { // success
                            token.actor.update({
                                "data.hp.value": token.actor.data.data.hp.value - damage_roll.total
                            });
                        }
                        
                        save_roll.render().then(save_render => {
                            output_msg(token, destroyed, save_render, phys_save);
                        });
                    });
                    
                } else {
                    token.actor.update({
                        "data.hp.value": token.actor.data.data.hp.value - damage_roll.total
                    });
                    output_msg(token, false);
                }
            });
            
            canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [args.smite_template_id]);
            
        },
        smite_targets: targets,
        send_to_chat: send_result_to_chat,
        smite_template_id: smite_template[0].id,
        caster_id: caster_actor.id
    }],
});