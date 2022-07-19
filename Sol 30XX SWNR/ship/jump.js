let controlled_tokens = canvas.tokens.controlled;
//console.log(controlled_tokens);

if (controlled_tokens.length > 0){
	controlled_tokens.forEach(make_jump);
} else {
	ui.notifications.warn("No Tokens were selected");
}

function make_jump(token, index) {
    const attr = token.actor.data.data.attributes;
    if (!attr.hasOwnProperty("fuel") || !attr.hasOwnProperty("life_support") 
            || !attr.hasOwnProperty("crew")) {
        console.log("No fuel/life_support/crew property on " + token.data.name);
        return;
    }
    
    if (attr.fuel.value == 0) {
        ui.notifications.warn(token.data.name + " is out of fuel.");
        return;
    } else {
        token.actor.update({
           'data.attributes.fuel.value' : attr.fuel.value - 1
        });
    }
    
    const jump_duration = 1;
    const life_support_consumed = attr.crew.value * jump_duration;
    if (attr.life_support.value < life_support_consumed) {
        ui.notifications.warn(token.data.name + " doesn't have enough life support to make the jump.");
        return;
    } else {
        token.actor.update({
           'data.attributes.life_support.value' : attr.life_support.value - life_support_consumed
        });
    }
    
    
    // handle updating the calendar here
	//console.log(game.Gametime.DTNow()); // This shows the current game time 
	game.Gametime.advanceClock(jump_duration * 86400); // 86400 is seconds in a day
    
    // have to do the subtraction again for the fuel/life support because async update hasn't
    // been made to the actor yet most likely
    let jump_html = `<span style="float: left;">${token.data.name} makes a jump.</span></br>
                            <span style="float: left;">Remaining fuel: ${attr.fuel.value - 1}.
                            Remaining life support: ${attr.life_support.value - life_support_consumed}.</span></br>
                            <span style="float: left;">Time passed: ${jump_duration} day.</span>`;
 
    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({token: actor}),
        content: jump_html
    });
}