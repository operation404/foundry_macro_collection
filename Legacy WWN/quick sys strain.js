if (canvas.tokens.controlled.length > 0) {
    canvas.tokens.controlled.map((t) => t.actor).forEach((actor) => add_1_sys_strain(actor));
} else if (game.user.character) {
    add_1_sys_strain(game.user.character);
}

async function add_1_sys_strain(actor) {
    if (actor.data.data.details.strain) {
        const old_strain = actor.data.data.details.strain.value;
        const new_strain = old_strain + 1;
        const max_strain = actor.data.data.details.strain.max;
        if (new_strain <= max_strain) {
            actor.update({
                'data.details.strain.value': new_strain,
            });
        }
        const strain_update_msg =
            old_strain === max_strain
                ? `<b style="color:#FF0000;">already at max!</b>`
                : `${old_strain} &#8594; ${
                      new_strain === max_strain ? `<b style="color:#FF0000;">${new_strain}</b>` : new_strain
                  } (max ${max_strain})`;
        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: `<span>${actor.name} system strain: ${strain_update_msg}</span>`,
        });
    }
}
