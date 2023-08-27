let send_result_to_chat = true;
console.log(game.user.targets);
game.user.targets.forEach(check_sleep_target);

async function check_sleep_target(token) {
    console.log(token);
    if (!(token.actor.type === "monster" || token.actor.type === "character")) return;
    
    let hit_die_count = token.actor.type === "monster" ? 
                            token.actor.data.data.hp.hd : 
                            token.actor.data.data.details.level;
                            
    // +X on a string that only contains numeric characters converts it to a number
    // if it has any non-numeric characters, it becomes NaN
    // this can be used to test for strings that aren't numbers, whereas parseInt will
    // still succeed so long as the string starts with numeric characters
    if (isNaN(+hit_die_count) || (hit_die_count = parseInt(hit_die_count)) < 1) {
        ui.notifications.warn(token.actor.data.name + " has improper hit dice/level set.");
        return;
    }

    if (hit_die_count <= 4) { // Can be put to sleep
        if (!game.cub.hasCondition("EFFECT.StatusAsleep", token.actor)) {

            token.actor.createEmbeddedDocuments("ActiveEffect", [{
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
            }]);
        }
        
        if (send_result_to_chat) output_msg(token, true);
    } else {
        if (send_result_to_chat) output_msg(token, false);
    }
}

async function output_msg(token, slept) {
    let result;
    if (slept) {
        result = `<b style="color:red;">was put to sleep!</b>`;
    } else {
        result = `<b style="color:green;">resisted being put to sleep!</b>`;
    }
    
    let chat_message_html = `
        <span style="float: left;">${token.actor.data.name} ${result}</span></br>
        `;
    
    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({token: token.document}),
        content: chat_message_html 
    });
}


// This could be accomplished by going to the condition lab and
// setting the sleep condition to be an overlay then using cub to
// apply the condition, but I wanted to figure out how to do it
// manually. I need to make sure to set all these flags and ids
// properly so that cub still recognizes the effect as being one
// of the game's standard conditions

//game.cub.addCondition("EFFECT.StatusAsleep", token.actor);

/*
token.actor.createEmbeddedDocuments("ActiveEffect", [{
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
}]);
*/