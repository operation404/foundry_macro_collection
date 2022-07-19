(async () => {
    if (canvas.tokens.controlled.length === 0) return ui.notifications.error("Choose tokens to roll for");
    await canvas.tokens.toggleCombat();
    let chosenTokens = canvas.tokens.controlled;
    let initiatives = chosenTokens.map(t => {
        let chosenActor = t.actor;
        let dexmod = chosenActor.data.data.stats.dex.mod;
        let roll = new Roll(`2d8k + ${dexmod}`).roll();
        roll.toMessage({speaker: ChatMessage.getSpeaker({token: t})});
        let combatantId = game.combat.combatants.find(c => c.name === t.name)._id;
        return{
            _id: combatantId,
            initiative: roll.total,
        };
    });
    await game.combat.updateCombatant(initiatives);
})();