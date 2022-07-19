const controlled_tokens = canvas.tokens.controlled;


if (controlled_tokens.length > 0){
	controlled_tokens.forEach(change_dr);
} else {
	ui.notifications.warn("No Tokens were selected");
}

function change_dr(token, index) {
    const new_shape = "1x1";
    const new_token_width = 1;
    const new_token_height = 1;

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
    
    const hardness = old_dr <= 3 ? "soft" : (old_dr <= 6 ? "medium" : "hard");
    
    const new_img = "images/cover/" + hardness + "%20cover%20" + new_shape + ".svg";

    
    token.actor.update({
        'data.attributes.shape.value' : new_shape
    });
    token.update({
        'img' : new_img,
        'height' : new_token_width,
        'width' : new_token_height
    });
}