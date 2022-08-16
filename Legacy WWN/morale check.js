let send_result_to_chat = true;
let check = false;
let check_modifier = 0;
let custom_dialog = new Dialog({
    title: `Morale Check`,
    content: `
        <form>
        <div class="form-group" style="flex-direction: row;">
            <div></div>
            <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Check modifier: </label>
            <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="check_modifier" type="number" step="1" value="0" />
            <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px;">Display results: </label>
            <input type="checkbox" id="display_checks" ${send_result_to_chat ? `checked` : ``}>
            <div></div>
        </div>
        <hr>
        </form>
    `,
    buttons: {
       check: {
           label: `Make morale checks`,
           callback: () => {
               check = true;
           }
       }
    },
    default: "check",
    close: () => {
        if (!check) return;
       
        check_modifier = Math.floor(parseFloat($("#check_modifier").val()));
        send_result_to_chat = $("#display_checks")[0].checked;
        // Does same as above line without using jQuery
        // send_result_to_chat = document.getElementById('display_checks').checked;
       
        if (canvas.tokens.controlled.length === 0) {
            // Test all tokens in scene
            canvas.tokens.placeables.map(token => check_morale(token));
        } else {
            // Test only selected tokens
            canvas.tokens.controlled.map(token => check_morale(token));    
        }
    }
});
custom_dialog.render(force = true);

async function check_morale(token) {
    if (token.actor.type !== "monster") return; // Only monsters have morale
    
    // This works even if token morale is different from base actors
    const morale_val = token.actor.data.data.details.morale;
    if (morale_val === 0) {
        ui.notifications.warn(token.actor.data.name + " has no morale score set.");
        return;
    }
    
    let roll_formula = check_modifier === 0 ? "2d6"
                        : check_modifier > 0 ? "2d6 - " + check_modifier
                        : "2d6 + " -check_modifier;
    
    const morale_dice_roll = await (new Roll(roll_formula)).roll();

    if (morale_dice_roll.total > morale_val) { // Failed morale check
        if (!game.cub.hasCondition("EFFECT.StatusFear", token.actor)) {
            game.cub.addCondition("EFFECT.StatusFear", token.actor);
        }
        if (send_result_to_chat) morale_check_msg(token, false, morale_dice_roll);
    } else {
        if (send_result_to_chat) morale_check_msg(token, true, morale_dice_roll);
    }
}

async function morale_check_msg(token, passed, roll) {
    const roll_render = await roll.render();
    let result;
    if (passed) {
        result = `<b style="color:green;">Passed! (${token.actor.data.data.details.morale})</b>`;
    } else {
        result = `<b style="color:red;">Failed! (${token.actor.data.data.details.morale})</b>`;
    }
    
    let chat_message_html = `
        <span style="float: left;">${token.actor.data.name} morale check: ${result}</span></br>
        ${roll_render}
        `;
    
    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({token: token.document}),
        content: chat_message_html 
    });
}