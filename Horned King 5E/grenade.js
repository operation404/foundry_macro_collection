const nomsy_actor = game.actors.find(a => a.name === "Nomsy");
const grenade_item = nomsy_actor.items.find(i => i.name === "Grenade");

if (nomsy_actor === undefined) {
    ui.notifications.error("Nomsy actor not found.");
    return;
}

const result = await (warpgate.crosshairs.show(
    config = {
        size: 6,
        icon: "icons/svg/target.svg",
        label: "Grenade Radius",
        tag: "GrenadeRadius",
        interval: 1,
        fillAlpha: 0.2,
        lockSize: true,
        rememberControlled: true,
    },
    callbacks = {}
));
if (result.cancelled) return;


const grenade_template_data = {
    t: "circle",
    user: game.user.id,
    distance: (canvas.scene.grid.distance) * 3, // radius
    x: result.x,
    y: result.y,
    fillColor: game.user.color,
};
const grenade_template = await (canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [grenade_template_data]));


const damage_roll = await (new Roll("@item.damage.parts.0.0", grenade_item.getRollData())).roll();

Requestor.request({
    whisper: [],
    title: `${nomsy_actor.name} uses a grenade!`,
    img: "icons/weapons/thrown/bomb-fuse-black-grey.webp",
    buttonData: [{
        label: "Apply Grenade",
        action: async () => {
            if (!game.user.isGM) {
                ui.notifications.warn("Wrathful Detonation can only be applied by a GM.");
                return;
            }

            const scene = game.scenes.get(args.scene_id);
            if (scene === undefined) {
                ui.notifications.error("Invalid Scene ID.");
                return;
            }

            const grenade_template = scene.templates.get(args.grenade_template_id);
            if (grenade_template === undefined) {
                ui.notifications.warn("Invalid grenade Measued Template ID.");
                return;
            }

            const targeted_tokens = Boneyard.Template_Tools.template_get_tokens(grenade_template);

            const output_msg = (token, died, damage_taken, save_passed, save_render, blind_roll) => {
                const save_status = save_passed ?
                    `<b style="color:green;">passed save</b>` :
                    `<b style="color:red;">failed save</b>`;

                const died_status = died ?
                    `<b style="color:red;">died</b>` :
                    `<b style="color:green;">lived</b>`;

                const chat_message_html = `
                    ${token.actor.name} ${save_status}.<br>
                    Took ${damage_taken} damage, ${died_status}.<br>
                    ${save_render}
                    `;

                ChatMessage.create({
                    user: game.user._id,
                    speaker: ChatMessage.getSpeaker({
                        token: token.document
                    }),
                    content: chat_message_html,
                    blind: blind_roll
                });
            };
            const apply_damage = (actor, damage_arr) => {
                // Expects array of [{damage_total, damage_type}] ex. [{5, 'fire'}]

                const resistances = actor.system.traits.dr.value;
                const immunities = actor.system.traits.di.value;

                let total_damage_taken = 0;
                damage_arr.forEach(d => {
                    total_damage_taken += immunities.includes(d.type) ? 0 :
                        resistances.includes(d.type) ? Math.floor(d.total / 2) :
                        d.total;
                });

                const new_hp = actor.system.attributes.hp.value - total_damage_taken;
                actor.update({
                    "system.attributes.hp.value": new_hp
                });
                return {
                    new_hp: new_hp,
                    damage_taken: total_damage_taken
                };
            };

            const blind_roll = game.settings.get("core", "rollMode") !== "publicroll";
            for (const token of targeted_tokens) {
                if (token.actor.system.attributes.hp.value <= 0) continue;

                const save_roll = await (token.actor.rollAbilitySave(args.save.type, options = {
                    chatMessage: false
                }));
                const save_render = await (save_roll.render());
                let damage_ret;
                if (save_roll.total >= args.save.dc) {
                    if (args.save.half_on_success) {
                        const reduced_damage_arr = args.damage_arr.map(d => {
                            return {
                                total: Math.floor(d.total / 2),
                                type: d.type
                            };
                        });
                        damage_ret = apply_damage(token.actor, reduced_damage_arr);
                    }
                } else {
                    damage_ret = apply_damage(token.actor, args.damage_arr);
                }

                output_msg(token, damage_ret.new_hp <= 0, damage_ret.damage_taken, save_roll.total >= args.save.dc, save_render, blind_roll);
            }

            scene.deleteEmbeddedDocuments("MeasuredTemplate", [grenade_template.id]);
        },
        scene_id: canvas.scene.id,
        grenade_template_id: grenade_template[0].id,
        damage_arr: [{
            total: damage_roll.total,
            type: grenade_item.system.damage.parts[0][1]
        }],
        save: {
            type: grenade_item.system.save.ability,
            dc: grenade_item.system.save.dc,
            half_on_success: true
        },
    }],
});

const damage_render = await (damage_roll.render());
ChatMessage.create({
    user: game.user._id,
    speaker: ChatMessage.getSpeaker({
        actor: nomsy_actor
    }),
    content: `<span style="float: left;">Damage roll: </span></br>
                ${damage_render}
                `
});