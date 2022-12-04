// This script was written to deal with CUB conditions, but I wanted
// to know how to actually manage the conditions myself instead of
// just using CUB helper functions.

// Freeze to prevent the changing or deleting the functions
const WWN_Charge = Object.freeze({

    // tokens should be an array or iterable
    // considered checking for array instance, but unsure if that's good practice
    apply: (tokens) => {
        const condition_name = "EFFECT.Charge";
        const charge_ae_condition_data = game.settings.get("combat-utility-belt", "activeConditionMap").find(c => c.name === condition_name);
        if (charge_ae_condition_data === undefined) {
            ui.notifications.error(`Condition '${condition_name}' not found.`);
            return;
        }

        const charge_ae_condition = {
            // WWN system doesn't seem to support active effects. Have to do it manually
            //"changes": [{ "key": "data.aac.mod", "value": "-2", "mode": 2, "priority": 21 }],
            "flags": {
                "combat-utility-belt": {
                    "conditionId": charge_ae_condition_data.id,
                    "overlay": false
                },
                "core": {
                    "overlay": false,
                    "statusId": "combat-utility-belt." + charge_ae_condition_data.id
                }
            },
            "icon": charge_ae_condition_data.icon,
            //"id": "combat-utility-belt.charge", // Not actually sure what this is for
            "label": charge_ae_condition_data.name // Same as 'condition_name'
        };

        //tokens = tokens instanceof Array ? tokens : [tokens];
        tokens.forEach(t => {
            if (t.actor.effects.find(c => c.data.flags.core.statusId === charge_ae_condition.flags.core.statusId) === undefined) {
                t.actor.createEmbeddedDocuments("ActiveEffect", [charge_ae_condition]);
                if (t.actor.type === "character") {
                    t.actor.update({
                        "data.aac.mod": t.actor.data.data.aac.mod - 2,
                    });
                } else if (t.actor.type === "monster") {
                    // monster sheets don't utilize aac.mod
                    t.actor.update({
                        "data.aac.value": t.actor.data.data.aac.value - 2,
                    });
                }
                ChatMessage.create({
                    user: game.user._id,
                    speaker: ChatMessage.getSpeaker({
                        actor: t.actor
                    }),
                    content: `<span>${t.actor.name} <b style="color:blue;">charges</b> forward!</span><br>`
                });
            }
        });
    },

    // tokens should be an array or iterable
    remove: (tokens) => {
        const condition_name = "EFFECT.Charge";
        const charge_ae_condition_data = game.settings.get("combat-utility-belt", "activeConditionMap").find(c => c.name === condition_name);
        if (charge_ae_condition_data === undefined) {
            ui.notifications.error(`Condition '${condition_name}' not found.`);
            return;
        }

        //tokens = tokens instanceof Array ? tokens : [tokens];
        tokens.forEach(t => {
            const t_charge_cond = t.actor.effects.find(c => c.data.flags.core.statusId === `combat-utility-belt.${charge_ae_condition_data.id}`);
            if (t_charge_cond !== undefined) {
                t.actor.deleteEmbeddedDocuments("ActiveEffect", [t_charge_cond.id]);
                if (t.actor.type === "character") {
                    t.actor.update({
                        "data.aac.mod": t.actor.data.data.aac.mod + 2,
                    });
                } else if (t.actor.type === "monster") {
                    // monster sheets don't utilize aac.mod
                    t.actor.update({
                        "data.aac.value": t.actor.data.data.aac.value + 2,
                    });
                }
                ChatMessage.create({
                    user: game.user._id,
                    speaker: ChatMessage.getSpeaker({
                        actor: t.actor
                    }),
                    content: `<span>${t.actor.name} recovers from <b style="color:blue;">charging</b>.</span><br>`
                });
            }
        });
    },

});

// 'combatTurn' - hook for combat turn changing, not in v9 it seems
// 'combatRound' exists too
// updateCombat does the job fine too

// Remove the charge effect from the current acting token in turn order
Hooks.on("updateCombat", (combat_document, change, options, userId) => {
    if (!combat_document.started) return;
    const active_gm_user = game.users.find(u => u.isGM && u.active);
    if (active_gm_user === undefined || active_gm_user.id !== userId) return;
    const acting_token = canvas.tokens.documentCollection.find(t => t.id === combat_document.current.tokenId);
    if (acting_token !== undefined) WWN_Charge.remove([acting_token]);
});

// Remove charge effect from all tokens after the combat ends
Hooks.on("deleteCombat", (combat_document, change, options, userId) => {
    const active_gm_user = game.users.find(u => u.isGM && u.active);
    if (active_gm_user === undefined || active_gm_user.id !== userId) return;
    WWN_Charge.remove(Array.from(combat_document.scene.tokens));
});

// window.WWN_Charge = WWN_Charge;
// Below is a stricter version that ensures the WWN_Charge property cannot be modified
Object.defineProperty(window, 'WWN_Charge', {
    value: WWN_Charge,
    writable: false,
    configurable: false
});

console.log("=== WWN Charge world script loaded. ===");