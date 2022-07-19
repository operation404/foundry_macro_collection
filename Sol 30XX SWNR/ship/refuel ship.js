let controlled_tokens = canvas.tokens.controlled;
//console.log(controlled_tokens);

if (controlled_tokens.length > 0){
	controlled_tokens.forEach(refuel_ship);
} else {
	ui.notifications.warn("No Tokens were selected");
}

function refuel_ship(token, index) {
    const attr = token.actor.data.data.attributes;
    if (!attr.hasOwnProperty("fuel") || !attr.hasOwnProperty("ship_class")) {
        console.log("No fuel/ship_class property on " + token.data.name);
        return;
    }
    
    const fuel_current = attr.fuel.value;
    const fuel_max = attr.fuel.max;
    const ship_class = attr.ship_class.value;
    let fuel_cost;
    switch (ship_class) {
        case "fighter":
            fuel_cost = 50;
            break;
        case "frigate":
            fuel_cost = 500;
            break;
        case "cruiser":
            fuel_cost = 1250;
            break;
        case "capital":
            fuel_cost = 5000;
            break;
        default:
            ui.notifications.warn("Invalid ship class field for " + token.data.name);
            return;
    }
    
    const fuel_needed = fuel_max - fuel_current;
    const total_cost = fuel_cost * fuel_needed;
    
    // Update the actor's values - need to use update function or change will only be client side
    token.actor.update({
       'data.attributes.fuel.value' : fuel_max
    });

    let refueling_html = `<span style="float: left;">${token.data.name} refuels.</span></br>
                            <span style="float: left;">${fuel_current} -> ${fuel_max}</span></br>
                            <span style="float: left;">Cost is ${total_cost} credits.</span>`;
 
    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({token: actor}),
        content: refueling_html
    });
}