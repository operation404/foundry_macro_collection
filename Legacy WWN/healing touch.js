const FRIENDLY = 1;
const brad_actor = game.actors.find((actor) => actor.data.name === 'Aldin Conger');
const heal_data = {
    ...brad_actor.getRollData(),
    heal_skill_item: brad_actor.data.items.find((item) => item.data.type === 'skill' && item.data.name === 'Heal'),
};
const heal_roll_string = '2d6 + @heal_skill_item.data.data.ownedLevel + @details.level';

game.user.targets.forEach((target) => {
    const msg_as_target = (message) => send_message(target.document, message);
    const target_data = {
        ...target.actor.data.data,
        type: target.actor.data.type,
        disposition: target.data.disposition,
        strain: target.actor.data.data.details.strain,
    };

    const dont_heal_msg =
        target_data.disposition !== FRIENDLY
            ? `Shouldn't heal unfriendly target!`
            : target_data.hp.value >= target_data.hp.max
            ? `Target is at full HP!`
            : target_data.strain && target_data.strain.value >= target_data.strain.max
            ? `Target is at max system strain!`
            : null;
    if (dont_heal_msg) return msg_as_target(dont_heal_msg);

    new Roll(heal_roll_string, heal_data).roll({ async: true }).then((heal_roll) => {
        const changes = {
            'data.hp.value': Math.min(target_data.hp.value + heal_roll.total, target_data.hp.max),
        };
        let heal_msg = `<span><b style="color:green;">${target_data.hp.value}</b> hp &#8594; <b style="color:green;">${changes['data.hp.value']}</b> hp</span><br>`;

        if (target_data.strain) {
            changes['data.details.strain.value'] = target_data.strain.value + 1;
            heal_msg = `${heal_msg}<span><b style="color:maroon;">${target_data.strain.value}</b> strain &#8594; <b style="color:maroon;">${changes['data.details.strain.value']}</b> strain</span><br>`;
        }

        apply_healing(target, changes).then((error_msg) => {
            if (error_msg) ui.notifications.error(err_msg);
            else
                heal_roll
                    .render()
                    .then((heal_render) =>
                        msg_as_target(`<span>${target.name} is healed!</span><br>${heal_render}${heal_msg}`)
                    );
        });
    });
});

async function apply_healing(token, changes) {
    try {
        return await Boneyard.Socketlib_Companion.executeAsGM(
            ({ scene_id, token_id, changes }) => {
                const scene = game.scenes.get(scene_id);
                const token = scene?.tokens.get(token_id);
                if (scene && token) token.actor.update(changes);
                else return scene ? `Failed to fetch token: '${token_id}'` : `Failed to fetch scene: '${scene_id}'`;
            },
            {
                scene_id: canvas.scene.id,
                token_id: token.id,
                changes: changes,
            }
        );
    } catch (e) {
        const err_msg =
            e.name === 'SocketlibNoGMConnectedError'
                ? "Error: Can't run 'Healing Touch' macro, no GM client available."
                : 'Error: ' + e.message;
        console.error(e);
        console.error(err_msg);
        return err_msg;
    }
}

function send_message(token_doc, msg_content) {
    ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ token: token_doc }),
        content: msg_content,
    });
}
