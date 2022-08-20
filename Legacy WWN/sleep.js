let sleep_caster_string;
if (canvas.tokens.controlled.length > 0) {
    sleep_caster_string = canvas.tokens.controlled[0].actor.data.name;
} else {
    switch(game.user.name) {
    case "Caelan GM":
    case "Caelan":
        sleep_caster_string = "Rosaria Synn";
        break;
    case "Mason":
        sleep_caster_string = "Kazem Sahaba";
        break;
    case "Brad":
        sleep_caster_string = "Aldin Conger";
        break;
    case "Nick":
        sleep_caster_string = "Shelley";
        break;
    case "Amanda":
        sleep_caster_string = "Siwa Chekov";
        break;
    case "Gamemaster":
        sleep_caster_string = "Gamemaster";
        break;
    default:
        return;
    }   
}

let send_result_to_chat = true;
console.log(game.user.targets);
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
    console.log(token);
    if (!(token.actor.type === "monster" || token.actor.type === "character")) return;
    targets.push(token.id);
    target_names.push(token.actor.data.name);
});

await Requestor.request({
    whisper: [],
    title: `${sleep_caster_string} casts Sleep`,
    img: "icons/svg/sleep.svg",
    footer: target_names,
    buttonData: [{
        label: "Apply Sleep",
        action: async () => {
            if (!game.user.isGM) {
                ui.notifications.warn("Sleep can only be applied by a GM.");
                return;
            }
            
            let tokens = [];
            args.sleep_targets.forEach(id => {
                let token = canvas.tokens.placeables.find(token => token.id === id);
                if (token !== undefined) tokens.push(token);
            });
            
            const output_msg = (token, slept) => {
                let result = slept ? `<b style="color:red;">was put to sleep!</b>` 
                                   : `<b style="color:green;">resisted being put to sleep!</b>`;
                let chat_message_html = `
                    <span style="float: left;">${token.actor.data.name} ${result}</span></br>
                    `;
                ChatMessage.create({
                    user: game.user._id,
                    speaker: ChatMessage.getSpeaker({token: token.document}),
                    content: chat_message_html 
                });
            };
            
            tokens.forEach(token => {
               let hit_die_count = token.actor.type === "monster" ? 
                                token.actor.data.data.hp.hd : 
                                token.actor.data.data.details.level;
                if (isNaN(+hit_die_count) || (hit_die_count = parseInt(hit_die_count)) < 1) {
                    ui.notifications.warn(token.actor.data.name + " has improper hit dice/level set.");
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
            
        },
        sleep_targets: targets,
        sleep_condition: sleep_condition_cub,
        send_to_chat: send_result_to_chat
    }],
});