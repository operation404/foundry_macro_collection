let controlled_tokens = canvas.tokens.controlled;
//console.log(controlled_tokens);

if (controlled_tokens.length > 0){
	controlled_tokens.forEach(refill_ship);
} else {
	ui.notifications.warn("No Tokens were selected");
}

function refill_ship(token, index) {
    const attr = token.actor.data.data.attributes;
    if (!attr.hasOwnProperty("life_support")) {
        console.log("No life_support property on " + token.data.name);
        return;
    }
    
    const life_support_current = attr.life_support.value;
    const life_support_max = attr.life_support.max;
    const refill_cost = (life_support_max - life_support_current) * 20;
    
    // Update the actor's values - need to use update function or change will only be client side
    token.actor.update({
       'data.attributes.life_support.value' : life_support_max
    });
    // Can also format like this
    /*
    token.actor.update({
       data: {
           attributes: {
               life_support: {
                   value: life_support_max
               }
           }
       }
    });
    */
    
    let resupply_html = `<span style="float: left;">${token.data.name} refills their life support.</span></br>
                            <span style="float: left;">${life_support_current} -> ${life_support_max}</span></br>
                            <span style="float: left;">Cost is ${refill_cost} credits.</span>`;
 
    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({token: actor}),
        content: resupply_html
    });
}