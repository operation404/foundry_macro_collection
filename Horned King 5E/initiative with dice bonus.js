if (canvas.tokens.controlled.length === 0) {
    ui.notifications.warning("No tokens selected for initiative.");
    return;
}
const initiative_string = "2d20k1 + @abilities.dex.mod + @abilities.wis.mod + 5 + @attributes.maneuver_dice.value";
canvas.tokens.controlled.map(token => {
    if (!token.inCombat) token.toggleCombat();
    let init_roll = new Roll(initiative_string, token.actor.getRollData()).roll().then(init_roll => {
            game.combat.updateEmbeddedDocuments("Combatant", [{
                _id: game.combat.getCombatantByToken(token.id)._id,
                initiative: init_roll.total
            }]);
            init_roll.render().then(init_render => {
                ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker({token: token.document}),
                flavor: `<span class="flavor-text chat-portrait-text-size-name-dnd5e">${token.name} rolls for Initiative!</span>`,
                content: `${init_render}` 
                }); 
            });
    });
});