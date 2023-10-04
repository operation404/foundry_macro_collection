const pc_actor = game.user.character;
if (!pc_actor) return;

// Restore hp, don't go over max
const pc_hp = pc_actor.data.data.hp;
const heal_by = Math.floor(pc_hp.max / 4);
const old_hp = pc_hp.value;
const update_hp = Math.min(pc_hp.value + heal_by, pc_hp.max);

// Lower sys strain by 1, don't go below 0
const pc_sys_strain = pc_actor.data.data.details.strain;
const old_sys_strain = pc_sys_strain.value;
const update_sys_strain = pc_sys_strain.value > 0 ? pc_sys_strain.value-1 : 0;

// Set the new hp, sys strain, and also reset spells cast to 0
pc_actor.update({
    "data.hp.value": update_hp,
    "data.details.strain.value": update_sys_strain,
    "data.spells.perDay.value": 0,
});

// Reset committed effort for each art to 0
const pc_arts = pc_actor.data.items.filter(item => item.type === "art");
pc_arts.forEach(pc_arts => pc_arts.update({ "data.effort": 0 }));

let spells_arts_part = "";
if (pc_arts.length > 0) {
    if (pc_actor.data.data.spells.perDay.max > 0) {
        spells_arts_part = "<br><span>Spells and Effort reset.</span>";
    } else {
        spells_arts_part = "<br><span>Effort reset.</span>";
    }
}

let chat_output_html = `
    <span><b>${pc_actor.data.name}</b> gets a full night's rest.</span><br>
    <span>Hit points: ${old_hp} &#8594; ${update_hp}</span><br>
    <span>System strain: ${old_sys_strain} &#8594; ${update_sys_strain}</span>
    ${spells_arts_part}
`;

ChatMessage.create({
    user: game.user._id,
    speaker: ChatMessage.getSpeaker({actor: pc_actor}),
    content: chat_output_html
});