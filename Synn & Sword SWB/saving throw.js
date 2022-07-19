// Macro for handing saving throws

let target_token = canvas.tokens.controlled[0];
if(!target_token) {
    ui.notifications.info("Please select a token");
    return;
}
//console.log(target_token);


// Store token attributes for convenience
let token_atts = {
    "strength": target_token.document._actor.data.data.attributes.ability_scores.strength.value,
    "agility": target_token.document._actor.data.data.attributes.ability_scores.agility.value,
    "endurance": target_token.document._actor.data.data.attributes.ability_scores.endurance.value,
    "physical": target_token.document._actor.data.data.attributes.saves.physical.value,
    "evasion": target_token.document._actor.data.data.attributes.saves.evasion.value,
};

let advantage_value = 0;
let save_type;
let save_prof;
let attribute_bonus;

let custom_dialog = new Dialog({
    title: `Saving Throw Macro`,
    
    // The content field is the html that makes up the body of the dialogue
    // prompt, and you can have whatever you want in there for data entry
    content: `
        <form>
        <div class="form-group" style="flex-direction: column;">
            <label style="text-align: center;">Advantage Level: </label>
            <div class="flexrow" style="width: 100%;">
                <button id="disadv_button">Disadvantage</button>
                <input style="text-align:center; height: auto;" id="advantage_value" type="number" step="1" value="${advantage_value}" />
                <button id="adv_button">Advantage</button>
            </div>
        </div>
        <div class="form-group" style="flex-direction: column; padding-top: 5px;">
            <div class="flexrow" style="width: 100%;">
                <label style="padding-right: 5px; flex-grow: 0;">Modifier: </label>
                <input style="text-align:center; vertical-align: middle;" id="misc_mod" type="number" step="1" value="0" />
            </div>
        </div>
        <hr>
        </form>
        `,
    
    // Three buttons that set up our different attack types
    buttons: {
      physical: {
        label: `Physical Save`,
        callback: () => {
            save_type = "Physical";
            save_prof = token_atts.physical;
            attribute_bonus = token_atts.strength;
        },
      },
      evasion: {
        label: `Evasion Save`,
        callback: () => {
            save_type = "Evasion";
            save_prof = token_atts.evasion;
            attribute_bonus = token_atts.agility;
        },
      },
    },
    
    // Code that runs every time the dialog is rendered
    render: (html) => {
        // Update the advantage_value input element
        $("#advantage_value").val(advantage_value); // Have to update here, doing it in button funcs doesn't do anything
		
		$("#disadv_button").on("click", add_disadvantage);
		$("#adv_button").on("click", add_advantage);
		//html.find("#dec_button").on("click", dec_button_func); // Should do same thing as above
    },
    
    // The code to run once the prompt is exited via button press
    close: async (html) => {
        if (save_type === undefined) return;
        
        // default input type is string, for some reason, so need to parseInt
        const final_advantage_value = parseInt($("#advantage_value").val());
        const misc_mod = parseInt($("#misc_mod").val());

        
        let save_roll = final_advantage_value >= 0
            ? (3 + final_advantage_value) + "d8kh3" // Normal roll or roll with Advantage
            : (3 + (-1 * final_advantage_value)) + "d8kl3"; // Roll with Disadvantage
        //console.log(attack_roll);
        
        
        save_roll = save_roll + " + " + save_prof + " + " + attribute_bonus + " + " + misc_mod;
    
        const save = await (new Roll(save_roll)).roll({async: true});

        const save_render = await save.render();

        let chat_message_html = `
            <span style="float: left;">${token.data.name} makes a ${save_type} Save.</span></br>
            ${save_render}
            `;
    
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({token: actor}),
            content: chat_message_html 
        });
              
    },
});

let add_disadvantage = () => {
    advantage_value--;
    custom_dialog.render();
};

let add_advantage = () => {
    advantage_value++;
    custom_dialog.render();
};

custom_dialog.render(true);