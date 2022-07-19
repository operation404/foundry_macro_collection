// Macro for handling stamina management

let target_token = canvas.tokens.controlled[0];
if(!target_token) {
    ui.notifications.info("Please select a token");
    return;
}
//console.log(target_token);


// Store token attributes for convenience
let token_atts = {
    "stamina": target_token.document._actor.data.data.attributes.stamina.value,
    "stamina_max": target_token.document._actor.data.data.attributes.stamina.max,
    "endurance": target_token.document._actor.data.data.attributes.ability_scores.endurance.value,
};


let stamina_mod_value = 0;
let button_clicked;

let custom_dialog = new Dialog({
    title: `Expend Stamina Macro`,
    
    // The content field is the html that makes up the body of the dialogue
    // prompt, and you can have whatever you want in there for data entry
    content: `
        <form>
        <div class="form-group" style="flex-direction: column;">
            <label style="text-align: center;">Expend Stamina: </label>
            <div class="flexrow" style="width: 100%;">
                <button id="decrease_button">-</button>
                <input style="text-align:center; height: auto;" id="stamina_mod_value" type="number" step="1" value="${stamina_mod_value}" />
                <button id="increase_button">+</button>
            </div>
        </div>
        <hr>
        </form>
        `,
    
    // Three buttons that set up our different attack types
    buttons: {
      expend: {
        label: `Expend Stamina`,
        callback: () => {
            button_clicked = true;
        },
      },
    },
    
    // Code that runs every time the dialog is rendered
    render: (html) => {
        // Update the advantage_value input element
        $("#stamina_mod_value").val(stamina_mod_value); // Have to update here, doing it in button funcs doesn't do anything
		
		$("#decrease_button").on("click", decrease_button);
		$("#increase_button").on("click", increase_button);
		//html.find("#dec_button").on("click", dec_button_func); // Should do same thing as above
    },
    
    // The code to run once the prompt is exited via button press
    close: async (html) => {
        if (button_clicked === undefined) return;
        
        // default input type is string, for some reason, so need to parseInt
        let final_stamina_mod_value = parseInt($("#stamina_mod_value").val());
        
        // Check if actor has enough stamina to make the adjustment
        let remaining_stamina = token_atts.stamina - final_stamina_mod_value;
        if (remaining_stamina < 0 ) {
            ui.notifications.error("Not enough Stamina!");
            return;
        } else if (remaining_stamina > token_atts.stamina_max) {
            remaining_stamina = token_atts.stamina_max;
            final_stamina_mod_value = token_atts.stamina - token_atts.stamina_max;
        }
        
        // Update the actor stamina value
        target_token.document._actor.update({
            "data.attributes.stamina.value": remaining_stamina,
        });

        
        stamina_roll = final_stamina_mod_value.toString();

        const stamina = await (new Roll(stamina_roll)).roll({async: true});

        const stamina_render = await stamina.render();

        let chat_message_html = `
            <span style="float: left;">${token.data.name} expends Stamina.</span></br>
            ${stamina_render}
            `;
    
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({token: actor}),
            content: chat_message_html 
        });
              
    },
});

let decrease_button = () => {
    stamina_mod_value--;
    custom_dialog.render();
};

let increase_button = () => {
    stamina_mod_value++;
    custom_dialog.render();
};

custom_dialog.render(true);