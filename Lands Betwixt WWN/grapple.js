const grapple_attacker_token = canvas.tokens.controlled[0];
const grapple_defender_token = game.user.targets.first();

if (grapple_attacker_token === undefined) {
    ui.notifications.warn("No grapple attacker controlled.");
    return;
}
if (grapple_defender_token === undefined) {
    ui.notifications.warn("No grapple defender targeted.");
    return;
}

let grapple_initiated = false;
const custom_dialog = new Dialog({
    title: `Grapple Macro`,

    content: `
        <form>
            <div class="form-group" style="flex-direction: row;">
                <div style="flex-direction: column;">
                    <label style="white-space: nowrap; flex-grow: 0; padding-right: 0px;">Attacker modifier:</label>
                    <input style="text-align:center; height: auto; min-width: 40px; flex-grow: 0;" id="attacker_modifier" type="number" step="1" value="0" />
                </div>
                <div style="flex-direction: column;">
                    <label style="white-space: nowrap; flex-grow: 0; padding-right: 0px;">Defender modifier:</label>
                    <input style="text-align:center; height: auto; min-width: 40px; flex-grow: 0;" id="defender_modifier" type="number" step="1" value="0" />
                </div>
            </div>
            <hr>
        </form>
    `,

    buttons: {
        initiate: {
            label: `Initiate Grapple`,
            callback: () => {
                grapple_initiated = true;
            },
        },
    },

    default: "initiate",

    render: (html) => {},

    close: async (html) => {
        if (!grapple_initiated) {
            return;
        }

        const attacker_data = get_grapple_data(grapple_attacker_token);
        const defender_data = get_grapple_data(grapple_defender_token);

        if (attacker_data === undefined || defender_data === undefined) return;

        attacker_data.modifier = document.getElementById("attacker_modifier").value;
        defender_data.modifier = document.getElementById("defender_modifier").value;

        const attacker_roll = await (new Roll(`@dice + @punch + @str_mod + @modifier`, attacker_data).roll({
            async: true
        }));
        const defender_roll = await (new Roll(`@dice + @punch + @str_mod + @modifier`, defender_data).roll({
            async: true
        }));
        const attacker_render = await attacker_roll.render();
        const defender_render = await defender_roll.render();

        let grapple_success = false;
        if (attacker_roll.total > defender_roll.total) {
            grapple_success = true;
        } else if (attacker_roll.total === defender_roll.total &&
            grapple_attacker_token.actor.data.type === "character" &&
            grapple_defender_token.actor.data.type === "monster") {
            grapple_success = true;
        }

        if (grapple_success) {
            if (grapple_defender_token.actor.effects.find(c => c.data.flags.core.statusId === "combat-utility-belt.restrain") === undefined) {
                apply_grapple_condition(grapple_defender_token);
            }
        }

        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({
                actor: grapple_attacker_token.actor
            }),
            content: `
                <span>Grapple ${grapple_success
                    ? `<b style="color:green;">success</b>`
                    : `<b style="color:red;">fail</b>`
                }!</span><br>
                <span>${grapple_attacker_token.actor.name} grapple check:</span><br>
                ${attacker_render}
                <span>${grapple_defender_token.actor.name} grapple check:</span><br>
                ${defender_render}
                `,
        });
    },
});

function get_grapple_data(token) {
    let data = {
        dice: "2d6",
        str_mod: 0,
        punch: 0,
    };
    if (token.actor.data.type === "character") {
        const punch_item = token.actor.data.items.find(i => i.data.type === "skill" && i.data.name.toLowerCase() === "punch");
        if (punch_item !== undefined) {
            data.dice = punch_item.data.data.skillDice;
            data.punch = punch_item.data.data.ownedLevel;
        }
        data.str_mod = token.actor.data.data.scores.str.mod;
    } else if (token.actor.data.type === "monster") {
        data.punch = token.actor.data.data.details.skill;
    } else {
        ui.notifications.error(`Invalid actor type: ${token.actor.type}`);
        return undefined;
    }
    return data;
}

async function apply_grapple_condition(token) {
    const condition_data = {
        "flags": {
            "combat-utility-belt": {
                "conditionId": "restrain",
                "overlay": false
            },
            "core": {
                "statusId": "combat-utility-belt.restrain",
                "overlay": false
            }
        },
        "icon": "icons/svg/net.svg",
        "label": "Restrained"
    };

    // This macro won't work if the GM is on a different scene.
    // The token id will be from a token on the player's scene,
    // and the GM's client will try to find that token in the scene
    // they are currently on.

    try {
        Boneyard.executeAsGM_wrapper((args) => {
            const token = canvas.tokens.documentCollection.find(t => t.id === args.token_id);
            if (token !== undefined) {
                token.actor.createEmbeddedDocuments("ActiveEffect", [args.condition_data]);
            }
        }, {
            condition_data: condition_data,
            token_id: token.id
        });

    } catch (e) {
        console.error(e);
        if (e.name === "SocketlibNoGMConnectedError") {
            console.log("Error: Can't run 'Grapple' macro, no GM client available.");
            ui.notifications.error("Error: Can't run 'Grapple' macro, no GM client available.");
        } else {
            console.log("Error: " + e.message);
            ui.notifications.error("Error: " + e.message);
        }
    }
}

custom_dialog.render(force = true, options = {
    width: 325
});