if (canvas.tokens.controlled.length > 0) {
    canvas.tokens.controlled.map((t) => t.actor).forEach((actor) => add_1_sys_strain(actor));
} else if (game.user.character) {
    add_1_sys_strain(game.user.character);
}

async function add_1_sys_strain(actor) {
    if (actor.data.data.details.strain) {
        const old_strain = actor.data.data.details.strain.value;
        const new_strain = old_strain + 1;
        if (new_strain <= actor.data.data.details.strain.max) {
            actor.update({
                'data.details.strain.value': new_strain,
            });
        }
        const strain_update_msg =
            old_strain === actor.data.data.details.strain.max
                ? `<b style="color:#FF0000;">already at max!</b>`
                : new_strain === actor.data.data.details.strain.max
                ? `${old_strain} &#8594; <b style="color:#FF0000;">${new_strain}</b>`
                : `${old_strain} &#8594; ${new_strain}`;
        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: `<span>${actor.name} system strain: ${strain_update_msg}</span>`,
        });
    }
}
