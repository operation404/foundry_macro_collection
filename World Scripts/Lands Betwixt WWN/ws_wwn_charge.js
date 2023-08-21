class WWN_Charge {
    static condition_data = {
        flags: {
            core: {
                statusId: 'WWN_Charge_Condition',
                overlay: false,
            },
        },
        icon: 'icons/charging-bull.svg',
        label: 'Charge',
    };
    static adjust_values = {
        add: +2,
        subtract: -2,
    };
    static adjust_keys = {
        character: 'mod',
        monster: 'value',
    };

    static init() {
        WWN_Charge.prepare_hook_handlers();
        window.WWN_Charge = {
            apply: WWN_Charge.apply,
            remove: WWN_Charge.remove,
        };
        console.log('=== WWN charge world script loaded ===');
    }

    static prepare_hook_handlers() {
        Hooks.once('setup', WWN_Charge.create_charge_status_effect);
        Hooks.on('createActiveEffect', WWN_Charge.apply_ac_penalty);
        Hooks.on('deleteActiveEffect', WWN_Charge.remove_ac_penalty);
        Hooks.on('updateCombat', WWN_Charge.turn_start_remove_handler);
        Hooks.on('deleteCombat', WWN_Charge.combat_end_remove_handler);
    }

    static create_charge_status_effect() {
        CONFIG.statusEffects.push({
            id: WWN_Charge.condition_data.flags.core.statusId,
            label: WWN_Charge.condition_data.label,
            icon: WWN_Charge.condition_data.icon,
        });
    }

    static apply_ac_penalty(active_effect_document, options, triggering_user_id) {
        if (
            game.user.id === triggering_user_id &&
            active_effect_document.data.flags.core.statusId === WWN_Charge.condition_data.flags.core.statusId
        )
            WWN_Charge.adjust_ac(active_effect_document.parent, 'subtract');
    }

    static remove_ac_penalty(active_effect_document, options, triggering_user_id) {
        if (
            game.user.id === triggering_user_id &&
            active_effect_document.data.flags.core.statusId === WWN_Charge.condition_data.flags.core.statusId
        )
            WWN_Charge.adjust_ac(active_effect_document.parent, 'add');
    }

    static turn_start_remove_handler(combat_document, change, options, triggering_user_id) {
        if (
            combat_document.started &&
            game.user.id ===
                // find online gm with highest user id
                game.users.reduce((a, b) => {
                    return b.active && b.isGM && b.id > a ? b.id : a;
                }, '')
        )
            WWN_Charge.remove([combat_document.scene.tokens.get(combat_document.current.tokenId)]);
    }

    static combat_end_remove_handler(combat_document, options, triggering_user_id) {
        if (
            game.user.id ===
            // find online gm with highest user id
            game.users.reduce((a, b) => {
                return b.active && b.isGM && b.id > a ? b.id : a;
            }, '')
        )
            WWN_Charge.remove(combat_document.scene.tokens.contents);
    }

    static adjust_ac(actor, adjust_type) {
        if (WWN_Charge.adjust_keys[actor.type])
            actor.update({
                [`data.aac.${WWN_Charge.adjust_keys[actor.type]}`]:
                    actor.data.data.aac[WWN_Charge.adjust_keys[actor.type]] + WWN_Charge.adjust_values[adjust_type],
            });
        else throw new Error(`Invalid actor type: ${actor.type}`);
    }

    static apply(tokens) {
        tokens = tokens instanceof Array ? tokens : [tokens];
        tokens.forEach((t) => {
            if (
                t.actor.effects.find(
                    (c) => c.data.flags.core.statusId === WWN_Charge.condition_data.flags.core.statusId
                ) === undefined
            )
                t.actor.createEmbeddedDocuments('ActiveEffect', [WWN_Charge.condition_data]);
        });
    }

    static remove(tokens) {
        tokens = tokens instanceof Array ? tokens : [tokens];
        tokens.forEach((t) => {
            const t_charge_cond = t.actor.effects.find(
                (c) => c.data.flags.core.statusId === WWN_Charge.condition_data.flags.core.statusId
            );
            if (t_charge_cond) t.actor.deleteEmbeddedDocuments('ActiveEffect', [t_charge_cond.id]);
        });
    }
}

WWN_Charge.init();
