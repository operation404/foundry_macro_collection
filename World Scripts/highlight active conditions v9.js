class Condition_Highlighter {
    static init() {
        Condition_Highlighter.prepare_hook_handlers();
        console.log('=== Condition highlighter world script loaded ===');
    }

    static prepare_hook_handlers() {
        Hooks.on('renderTokenHUD', Condition_Highlighter.highlight_active_conditions);
    }

    static highlight_active_conditions(tokenHUD, html, data) {
        const token_effect_ids = tokenHUD.object.actor.effects.contents.map(
            (effect) => effect.data.flags.core.statusId
        );
        html[0]
            .querySelectorAll('div.control-icon[data-action="effects"] > div.status-effects > img')
            .forEach((effect_element) => {
                if (token_effect_ids.includes(effect_element.dataset.statusId))
                    effect_element.style.border = '2px solid var(--color-border-highlight)';
            });
    }
}
if (parseFloat(game.version) >= 10) {
    console.error('Condition highler world script is not updated for Foundry v10+');
} else Condition_Highlighter.init();
