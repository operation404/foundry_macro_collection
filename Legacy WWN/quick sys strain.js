if (canvas.tokens.controlled.length > 0) {
    canvas.tokens.controlled.map((t) => t.actor).forEach((actor) => add_1_sys_strain(actor));
} else if (game.user.character) {
    add_1_sys_strain(game.user.character);
}

async function add_1_sys_strain(actor) {
    const strain = actor.data.data.details.strain;
    if (strain) {
        let msg;
        if (strain.value === strain.max) {
            // maxed out already
            msg = `<span>${actor.name} already at <b style="color:#FF0000;">max system strain!</b></span>`;
        } else {
            const old_strain = strain.value;
            await actor.update({
                'data.details.strain.value': strain.value + 1,
            });
            msg = `<span>${actor.name} system strain: ${old_strain} &#8594; ${
                strain.value === strain.max ? `<b style="color:#FF0000;">${strain.value}</b>` : strain.value
            }</span>`;
        }
        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: msg,
        });
    }
}
