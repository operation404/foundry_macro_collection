const controlled_tokens = canvas.tokens.controlled;


if (controlled_tokens.length > 0){
	controlled_tokens.forEach(change_dr);
} else {
	ui.notifications.warn("No Tokens were selected");
}

function change_dr(token, index) {
    const new_height = "leg";

    const attr = token.actor.data.data.attributes;
    console.log(token);
    console.log(attr);
    
    if (!(attr.hasOwnProperty("isCover") && attr.isCover.value === true)) {
        console.log("Not a valid cover token: " + token.data.name);
        return;
    }
    
    const old_dr = token.actor.data.data.DR;
    const old_height = token.actor.data.data.attributes.height.value;
    const old_shape = token.actor.data.data.attributes.shape.value;
    const old_token_img = token.data.img;
    const old_token_tint = token.data.tint;
    
    let new_tint = "";
    switch (new_height) {
        case "leg":
            new_tint = "#ffcc88";
            break;
        case "chest":
            new_tint = "#ff860d";
            break;    
        case "head":
            new_tint = "#864300";
            break;
    }
    
    
    token.actor.update({
        'data.attributes.height.value' : new_height
    });
    token.update({
        'tint' : new_tint
    });
}