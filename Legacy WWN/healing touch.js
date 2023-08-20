/* 
Usage:
If targeting tokens, attempt to heal those tokens and clear targets.

If not, enter targeting mode and heal next targeted token then clear targets.
Cancel macro early if tool is changed off targeting.

Tokens who aren't friendly, are at max hp, or have max system strain won't be healed.
*/

const FRIENDLY = 1;
const brad_actor = game.actors.find((actor) => actor.data.name === 'Aldin Conger');
const heal_data = {
    ...brad_actor.getRollData(),
    heal_skill_item: brad_actor.data.items.find((item) => item.data.type === 'skill' && item.data.name === 'Heal'),
};
const heal_roll_string = '2d6 + @heal_skill_item.data.data.ownedLevel + @details.level';

const heal_and_clear_targets = (tokens) => {
    heal_tokens(tokens);
    game.user.updateTokenTargets([]);
};

if (game.user.targets.size === 0) {
    const token_controls = document.body.querySelector('nav#controls li.scene-control[data-control="token"]');
    const target_control = document.body.querySelector('nav#controls li.control-tool[data-tool="target"]');
    if (token_controls && target_control) {
        token_controls.click();
        target_control.click();

        const target_hook_id = Hooks.once('targetToken', (user, token, targeted) => {
            console.log('targetToken');
            if (targeted) heal_and_clear_targets([token]);
            Hooks.off('renderSceneControls', controls_hook_id);
        });

        const controls_hook_id = Hooks.on('renderSceneControls', (scene_controls, html, options) => {
            console.log('renderSceneControls');
            if (scene_controls.activeControl !== 'token' || scene_controls.activeTool !== 'target') {
                Hooks.off('targetToken', target_hook_id);
                Hooks.off('renderSceneControls', controls_hook_id);
            }
        });
    }
} else heal_and_clear_targets(game.user.targets);

// -------- helper functions --------

function heal_tokens(tokens) {
    tokens.forEach((target) => {
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
}

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
