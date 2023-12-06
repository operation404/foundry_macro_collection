class Condition_Highlighter {
    static init() {
        Condition_Highlighter.prepare_hook_handlers();
        console.log('=== Condition highlighter world script loaded ===');
    }

    static prepare_hook_handlers() {
        Hooks.on('renderTokenHUD', Condition_Highlighter.highlight_active_conditions);
    }

    static highlight_active_conditions(tokenHUD, html, data) {
        const allStatuses = tokenHUD.object.actor.effects.contents.reduce(
            (statusSet, effect) => statusSet.union(effect.statuses),
            new Set()
        );

        html[0]
            .querySelectorAll('div.control-icon[data-action="effects"] > div.status-effects > img')
            .forEach((effect_element) => {
                if (allStatuses.has(effect_element.dataset.statusId))
                    effect_element.style.border = '2px solid var(--color-border-highlight)';
            });
    }
}

Condition_Highlighter.init();
