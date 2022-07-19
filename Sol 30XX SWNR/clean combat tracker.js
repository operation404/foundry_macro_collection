if (game.combat !== null) {
    game.combat.data.combatants.forEach(function(combatant){
        const token = combatant.token;
        if (!token.actorLink && token.hasOwnProperty("actorData")
                && token.actorData.hasOwnProperty("effects")
                && token.actorData.effects.find(e => e.label === "Skull") !== undefined) {
            game.combat.deleteCombatant(combatant._id);
        }        
    });
}

// The below code gets every token on the active canvas and checks to see if
// it is in combat, removing if so. The above code only gets tokens from
// the active combat encounter, so I figure it's better.

/*const tokens = canvas.tokens.ownedTokens;
tokens.forEach(function(token){
    if (!token.data.actorLink && token.data.hasOwnProperty("actorData")
            && token.data.actorData.hasOwnProperty("effects")
            && token.data.actorData.effects.find(e => e.label === "Skull") !== undefined) {
        if (token.inCombat) { 
            token.toggleCombat();
        }
    }
});*/