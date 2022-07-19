let controlled_tokens = canvas.tokens.controlled;
//console.log(controlled_tokens);

if (controlled_tokens.length > 0){
	controlled_tokens.forEach(ship_status);
} else {
	ui.notifications.warn("No Tokens were selected");
}

function ship_status(token, index) {
    const attr = token.actor.data.data.attributes;
    if (!attr.hasOwnProperty("fuel") || !attr.hasOwnProperty("life_support") 
            || !attr.hasOwnProperty("crew")) {
        console.log("No fuel/life_support/crew property on " + token.data.name);
        return;
    }
    
    let status_html = `<span style="float: left;">${token.data.name} status report.</span></br>
                            <span style="float: left;">Fuel: ${attr.fuel.value} / ${attr.fuel.max}</span></br>
                            <span style="float: left;">Life Support: ${attr.life_support.value} 
                                / ${attr.life_support.max}</span></br>
                            <span style="float: left;">Current Crew: ${attr.crew.value} 
                                (Min: ${attr.crew.min} / Max: ${attr.crew.max})</span></br>
                            `;
 
    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({token: actor}),
        content: status_html
    });
}