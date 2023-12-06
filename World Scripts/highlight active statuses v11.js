class StatusHighlighter {
    static init() {
        StatusHighlighter.prepareHookHandlers();
        console.log('=== Status highlighter world script loaded ===');
    }

    static prepareHookHandlers() {
        Hooks.on('renderTokenHUD', StatusHighlighter.highlightActive);
    }

    static highlightActive(tokenHUD, html, data) {
        html[0]
            .querySelectorAll('div.control-icon[data-action="effects"] > div.status-effects > img')
            .forEach((effectElement) => {
                if (effectElement.classList.contains('active'))
                    effectElement.style.border = '2px solid var(--color-border-highlight)';
            });
    }

    /*
    static old_highlight_active_conditions(tokenHUD, html, data) {
        const allStatuses = tokenHUD.object.actor.effects.contents.reduce(
            (statusSet, effect) => statusSet.union(effect.statuses),
            new Set()
        );

        html[0]
            .querySelectorAll('div.control-icon[data-action="effects"] > div.status-effects > img')
            .forEach((effect_element) => {
                console.dir(effect_element);
                if (allStatuses.has(effect_element.dataset.statusId))
                    effect_element.style.border = '2px solid var(--color-border-highlight)';
            });
    }
    */
}

StatusHighlighter.init();
