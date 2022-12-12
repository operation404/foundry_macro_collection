const DEBUG = true;

let sleep_caster_string;
if (canvas.tokens.controlled.length > 0) {
    sleep_caster_string = canvas.tokens.controlled[0].actor.data.name;
} else {
    ui.notifications.warn("No token controlled for caster.");
    return;
}

let result = await warpgate.crosshairs.show(
    config = {
        size: 8,
        icon: "icons/svg/target.svg",
        label: "Sleep Radius",
        tag: "SleepRadius",
        interval: 1,
        fillAlpha: 0.2,
        lockSize: true,
        rememberControlled: true,
    },
    callbacks = {}
);
if (result.cancelled) return;

const sleep_template_data = {
    t: "circle",
    user: game.user.id,
    distance: (canvas.scene.data.gridDistance) * 4, //radius
    x: result.x,
    y: result.y,
    fillColor: game.user.color,
};
let sleep_template = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [sleep_template_data]);
// When using DF Template Enhancements, targeting tokens
// is part of the template drawing. So long as await is
// used on the template creation, we should have all of
// the tokens targeted after creation resolves.
if (DEBUG) console.log(sleep_template[0].id);

let send_result_to_chat = true;
if (DEBUG) console.log(game.user.targets);
const sleep_condition_cub = {
    "flags": {
        "combat-utility-belt": {
            "conditionId": "sleep",
            "overlay": false
        },
        "core": {
            "overlay": true,
            "statusId": "combat-utility-belt.sleep"
        }
    },
    "icon": "icons/svg/sleep.svg",
    "id": "combat-utility-belt.sleep",
    "label": "EFFECT.StatusAsleep"
};

let targets = [];
let target_names = [];
game.user.targets.forEach(token => {
    if (!(token.actor.type === "monster" || token.actor.type === "character")) return;
    if (DEBUG) console.log(token);
    targets.push(token.id);
    target_names.push(token.actor.data.name);
});

await Requestor.request({
    whisper: [],
    title: `${sleep_caster_string} casts Sleep`,
    img: "icons/wc3_sleep.png",
    footer: target_names,
    buttonData: [{
        label: "Apply Sleep",
        action: async () => {
            if (!game.user.isGM) {
                ui.notifications.warn("Sleep can only be applied by a GM.");
                return;
            }
            if (canvas.templates.placeables.find(template => template.id === args.sleep_template_id) === undefined) {
                ui.notifications.warn("This instance of the Sleep spell has already been applied.");
                return;
            }

            let tokens = [];
            args.sleep_targets.forEach(id => {
                let token = canvas.tokens.placeables.find(token => token.id === id);
                if (token !== undefined) tokens.push(token);
            });

            const output_msg = (token, slept) => {
                let result = slept ? `<b style="color:red;">was put to sleep!</b>` :
                    `<b style="color:green;">resisted being put to sleep!</b>`;
                let chat_message_html = `
                    <span style="float: left;">${token.actor.data.name} ${result}</span></br>
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
                let hit_die_count = token.actor.type === "monster" ?
                    token.actor.data.data.hp.hd :
                    token.actor.data.data.details.level;
                if (isNaN(hit_die_count = parseInt(hit_die_count)) || hit_die_count < 1) {
                    ui.notifications.warn(token.actor.data.name + " has improper hit dice/level set.");
                    return;
                }
                if (token.actor.data.data.hp.value < 1) { // Don't apply sleep to dead creatures
                    return;
                }

                if (hit_die_count <= 4) { // Can be put to sleep
                    if (!game.cub.hasCondition("EFFECT.StatusAsleep", token.actor)) {
                        token.actor.createEmbeddedDocuments("ActiveEffect", [args.sleep_condition]);
                    }
                    if (args.send_to_chat) output_msg(token, true);
                } else {
                    if (args.send_to_chat) output_msg(token, false);
                }
            });

            canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [args.sleep_template_id]);

        },
        sleep_targets: targets,
        sleep_condition: sleep_condition_cub,
        send_to_chat: send_result_to_chat,
        sleep_template_id: sleep_template[0].id
    }],
});