// Macro for handing weapon attacks

let target_token = canvas.tokens.controlled[0];
if(!target_token) {
    ui.notifications.info("Please select a token");
    return;
}


// Store token attributes for convenience
let token_atts = {
    "ability_scores": target_token.document._actor.data.data.attributes.ability_scores,
    "skills": target_token.document._actor.data.data.attributes.skills,
};

let skill_select_list = ``;
Object.entries(token_atts.skills).forEach(([key, val]) => {
    skill_select_list = `${skill_select_list}
    <option value="${key}">${val.label}</option>`
});

let ability_scores_select_list = ``;
Object.entries(token_atts.ability_scores).forEach(([key, val]) => {
    ability_scores_select_list = `${ability_scores_select_list}
    <option value="${key}">${val.label}</option>`
});


let advantage_value = 0;
let roll_button_clicked;

let custom_dialog = new Dialog({
    title: `Skill Check Macro`,
    
    // The content field is the html that makes up the body of the dialogue
    // prompt, and you can have whatever you want in there for data entry
    content: `
        <form>
        <div class="form-group" style="padding-top: 5px;">
            <div style="display: flex; flex-direction: row; flex-grow: 2.5;">
                <label style="padding-right: 5px; flex-grow: 0;">Skill: </label>
                <select id="skill_select" style="flex-grow: 1; margin-right: 5px;">
                    ${skill_select_list}
                </select>
            </div>
            <div style="display: flex; flex-direction: row;">
                <label style="width: auto; padding-right: 5px; flex-grow: 0;">Ability Score: </label>
                <select id="ability_scores_select" style="flex-grow: 1; margin-right: 5px;">
                    ${ability_scores_select_list}
                </select>
            </div>
        </div>
        <div class="form-group" style="flex-direction: column;">
            <label style="text-align: center;">Advantage Level: </label>
            <div class="flexrow" style="width: 100%;">
                <button id="disadv_button">Disadvantage</button>
                <input style="text-align:center; height: auto;" id="advantage_value" type="number" step="1" value="${advantage_value}" />
                <button id="adv_button">Advantage</button>
            </div>
        </div>
        <div class="form-group" style="padding-top: 5px;">
            <label style="padding-right: 5px; flex-grow: 0;">Modifier: </label>
            <input style="text-align:center; vertical-align: middle;" id="misc_mod" type="number" step="1" value="0" />
        </div>
        <hr>
        </form>
        `,
    
    // Three buttons that set up our different attack types
    buttons: {
      roll: {
        label: `Roll Skill Check`,
        callback: () => {
            roll_button_clicked = true;
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
        if (roll_button_clicked === undefined) return;
        
        // default input type is string, for some reason, so need to parseInt
        const final_advantage_value = parseInt($("#advantage_value").val());
        const misc_mod = parseInt($("#misc_mod").val());
        const selected_skill = $("#skill_select").val();
        const selected_ability_score = $("#ability_scores_select").val();
        
        let skill_roll = final_advantage_value >= 0
            ? (3 + final_advantage_value) + "d8kh3" // Normal roll or roll with Advantage
            : (3 + (-1 * final_advantage_value)) + "d8kl3"; // Roll with Disadvantage
        
        
        skill_roll = skill_roll + " + " + token_atts.ability_scores[selected_ability_score].value + " + " + token_atts.skills[selected_skill].value + " + " + misc_mod;
    
        const skill = await (new Roll(skill_roll)).roll({async: true});

        const skill_render = await skill.render();

        let chat_message_html = `
            <span style="float: left;">${token.data.name} makes a ${token_atts.skills[selected_skill].label} (${token_atts.ability_scores[selected_ability_score].label}) Check.</span></br>
            ${skill_render}
            `;
    
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({token: actor}),
            content: chat_message_html 
        });
              
    },
});

let add_disadvantage = () => {
    //console.log("disadv button");
    advantage_value--;
    custom_dialog.render();
};

let add_advantage = () => {
    //console.log("adv button");
    advantage_value++;
    custom_dialog.render();
};

custom_dialog.render(true);