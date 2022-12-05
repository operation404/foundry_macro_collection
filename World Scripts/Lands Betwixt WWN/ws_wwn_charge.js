class WWN_Charge {

    static condition_data = {
        "flags": {
            "core": {
                "statusId": "WWN_Charge_Condition",
                "overlay": false
            }
        },
        "icon": "icons/charging-bull.svg",
        "label": "Charge"
    };
    static adjust_values = {
        "add": +2,
        "subtract": -2
    };
    static adjust_keys = {
        "character": "mod",
        "monster": "value"
    };

    static init() {
        WWN_Charge.prepare_hook_handlers();

        // Create a global object to expose only the desired functions
        window.WWN_Charge = {
            apply: WWN_Charge.apply,
            remove: WWN_Charge.remove
        };
        console.log("=== WWN charge world script loaded ===");
    }

    static prepare_hook_handlers() {
        Hooks.once("setup", WWN_Charge.create_charge_status_effect);
        Hooks.on("createActiveEffect", WWN_Charge.apply_ac_penalty);
        Hooks.on("deleteActiveEffect", WWN_Charge.remove_ac_penalty);
        Hooks.on("updateCombat", WWN_Charge.turn_start_remove_handler);
        Hooks.on("deleteCombat", WWN_Charge.combat_end_remove_handler);
    }

    static create_charge_status_effect() {
        CONFIG.statusEffects.push({
            id: WWN_Charge.condition_data.flags.core.statusId,
            label: WWN_Charge.condition_data.label,
            icon: WWN_Charge.condition_data.icon
        });
    }

    static apply_ac_penalty(active_effect_document, options, user_id) {
        if (active_effect_document.data.flags.core.statusId !== WWN_Charge.condition_data.flags.core.statusId) return;
        WWN_Charge.adjust_ac(active_effect_document.parent, "subtract");
    }

    static remove_ac_penalty(active_effect_document, options, user_id) {
        if (active_effect_document.data.flags.core.statusId !== WWN_Charge.condition_data.flags.core.statusId) return;
        WWN_Charge.adjust_ac(active_effect_document.parent, "add");
    }

    static turn_start_remove_handler(combat_document, change, options, user_id) {
        if (!combat_document.started) return;

        // Only run on one GM client if multiple connected
        const active_gm_user = game.users.find(u => u.isGM && u.active);
        if (active_gm_user === undefined || active_gm_user.id !== game.user.id) return;

        const acting_token = canvas.tokens.documentCollection.find(t => t.id === combat_document.current.tokenId);
        if (acting_token !== undefined) WWN_Charge.remove([acting_token]);
    }

    static combat_end_remove_handler(combat_document, options, user_id) {
        // Only GM can end combat so user_id is guaranteed GM, runs on only their client
        if (user_id !== game.user.id) return;

        const combat_scene_tokens = combat_document.scene.tokens;
        if (combat_scene_tokens !== undefined) WWN_Charge.remove(Array.from(combat_scene_tokens));
    }

    static adjust_ac(actor, adjust_type) {
        if (WWN_Charge.adjust_keys[actor.type] === undefined) throw new Error(`Invalid actor type: ${actor.type}`);
        actor.update({
            // { [VAR]: ... } syntax allows using dynamic keys in object literals
            [`data.aac.${WWN_Charge.adjust_keys[actor.type]}`]: actor.data.data.aac[WWN_Charge.adjust_keys[actor.type]] + WWN_Charge.adjust_values[adjust_type]
        });
    }

    static apply(tokens) {
        tokens = tokens instanceof Array ? tokens : [tokens];
        tokens.forEach(t => {
            if (t.actor.effects.find(c => c.data.flags.core.statusId === WWN_Charge.condition_data.flags.core.statusId) === undefined) {
                t.actor.createEmbeddedDocuments("ActiveEffect", [WWN_Charge.condition_data]);
            }
        });
    }

    static remove(tokens) {
        tokens = tokens instanceof Array ? tokens : [tokens];
        tokens.forEach(t => {
            const t_charge_cond = t.actor.effects.find(c => c.data.flags.core.statusId === WWN_Charge.condition_data.flags.core.statusId);
            if (t_charge_cond !== undefined) {
                t.actor.deleteEmbeddedDocuments("ActiveEffect", [t_charge_cond.id]);
            }
        });
    }

}

WWN_Charge.init();