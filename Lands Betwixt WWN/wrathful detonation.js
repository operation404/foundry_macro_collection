const DEBUG = true;

let attacker_actor;
if (canvas.tokens.controlled.length > 0) {
    attacker_actor = canvas.tokens.controlled[0].actor;
} else {
    ui.notifications.warn("No token selected!");
    return;
}

let result = await (warpgate.crosshairs.show(
    config = {
        size: 6,
        icon: "icons/svg/target.svg",
        label: "Wrathful Detonation Radius",
        tag: "WrathfulDetonationRadius",
        interval: 1,
        fillAlpha: 0.2,
        lockSize: true,
        rememberControlled: true,
    },
    callbacks = {}
));
if (result.cancelled) return;

const wrathful_detonation_template_data = {
    t: "circle",
    user: game.user.id,
    distance: (canvas.scene.data.gridDistance) * 4, //radius
    x: result.x,
    y: result.y,
    fillColor: game.user.color,
};
let wrathful_detonation_template = await (canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [wrathful_detonation_template_data]));
if (DEBUG) console.log(wrathful_detonation_template[0].id);

let send_result_to_chat = true;
if (DEBUG) console.log(game.user.targets);
let targets = [],
    target_names = [];
game.user.targets.forEach(token => {
    if (token.actor.data.data.hp.max === null || token.actor.data.data.hp.max === 0) return;
    if (DEBUG) console.log(token);
    targets.push(token.id);
    target_names.push(token.actor.data.name);
});

Requestor.request({
    whisper: [],
    title: `${attacker_actor.data.name} uses a Wrathful Detonation elixir!`,
    img: "icons/weapons/thrown/bomb-fuse-black-pink.webp",
    footer: target_names,
    buttonData: [{
        label: "Apply Wrathful Detonation",
        action: async () => {
            if (!game.user.isGM) {
                ui.notifications.warn("Wrathful Detonation can only be applied by a GM.");
                return;
            }
            if (canvas.templates.placeables.find(template => template.id === args.wrathful_detonation_template_id) === undefined) {
                ui.notifications.warn("This instance of Wrathful Detonation has already been applied.");
                return;
            }

            let attacker_actor = game.actors.get(args.attacker_actor_id);
            if (attacker_actor === undefined) {
                ui.notifications.warn("Attacker actor undefined.");
                return;
            }

            let tokens = [];
            args.wrathful_detonation_targets.forEach(id => {
                let token = canvas.tokens.documentCollection.get(id);
                if (token !== undefined) tokens.push(token);
            });

            let damage_roll = await (new Roll("2d6")).roll();
            let damage_render = await damage_roll.render();
            ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker({
                    actor: attacker_actor
                }),
                content: `<span style="float: left;">Damage roll: </span></br>
                            ${damage_render}
                            `
            });

            const output_msg = async (token, died) => {
                const died_status = died ?
                    `<b style="color:red;">was blown up.</b>` :
                    `<b style="color:green;">wasn't completely blown up.</b>`;

                let chat_message_html = `
                    ${token.actor.data.name} ${died_status}
                    `;

                ChatMessage.create({
                    user: game.user._id,
                    speaker: ChatMessage.getSpeaker({
                        token: token.document
                    }),
                    content: chat_message_html
                });
            };

            tokens.forEach(token => {
                if (token.actor.data.data.hp.value < 1) { // Don't kill dead targets
                    return;
                }
                const new_hp = token.actor.data.data.hp.value - damage_roll.total;
                output_msg(token, new_hp <= 0);
                token.actor.update({
                    "data.hp.value": new_hp
                });
            });

            canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [args.wrathful_detonation_template_id]);
        },
        wrathful_detonation_targets: targets,
        send_to_chat: send_result_to_chat,
        wrathful_detonation_template_id: wrathful_detonation_template[0].id,
        attacker_actor_id: attacker_actor.id
    }],
});