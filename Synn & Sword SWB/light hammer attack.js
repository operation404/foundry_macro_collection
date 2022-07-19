// Macro for handing weapon attacks
let weapon_name = "Light Hammer"; // Change this to the name of the weapon you want to roll

let target_token = canvas.tokens.controlled[0];
if(!target_token) {
    ui.notifications.info("Please select a token");
    return;
}
//console.log(target_token);


// Store token attributes for convenience
let token_atts = {
    "stamina": target_token.document._actor.data.data.attributes.stamina.value,
    "strength": target_token.document._actor.data.data.attributes.ability_scores.strength.value,
    "agility": target_token.document._actor.data.data.attributes.ability_scores.agility.value,
    "endurance": target_token.document._actor.data.data.attributes.ability_scores.endurance.value,
    "strike": target_token.document._actor.data.data.attributes.skills.strike.value,
    // These are for later
    //"shoot": target_token.document._actor.data.data.attributes.skills.shoot.value,
    //"brawling": target_token.document._actor.data.data.attributes.skills.brawling.value,
    //"throw": target_token.document._actor.data.data.attributes.skills.throw.value,
};


const items_array = target_token.document._actor.data.items.contents;
//console.log(items_array);
let item;
for (let i = 0; i < items_array.length; i++) {
    const item_name = items_array[i].data.name;
    if (item_name == weapon_name) {
        item = items_array[i];
    }
    //console.log(item_name);
}
if (item === undefined) {
    ui.notifications.error("Weapon type \"" + weapon_name + "\" not found on actor");
    return;
}
//console.log(item);

// Store weapon attributes for convenience
let weapon_atts = {
    "class": item.data.data.attributes.class.value,
    "speed": item.data.data.attributes.speed.value,
    "category": item.data.data.attributes.category.value,
    "has_colossal": item.data.data.attributes.has_colossal.value,
    "has_finesse": item.data.data.attributes.has_finesse.value,
    "damage_dice": item.data.data.attributes.damage_dice.value,
    "damage_type": item.data.data.attributes.damage_type.value,
};


if (!(weapon_atts.category === "melee" || weapon_atts.category === "ranged")) {
    ui.notifications.error(weapon_name + " has invalide category property");
    return;
}

// Set up the bonus to use, strength or agility
let attribute_bonus;
if (weapon_atts.has_finesse) {
    attribute_bonus = token_atts.strength > token_atts.agility ? token_atts.strength : token_atts.agility;
} else {
    if (weapon_atts.category === "melee") {
        attribute_bonus = token_atts.strength;
    } else {
        attribute_bonus = token_atts.agility;
    }
}

// Modify attribute based on speed and colossal property
// and set up extra stamina cost for attack
let damage_attribute_mult;
let weapon_additional_stamina_cost;
switch (weapon_atts.speed) {
    case "fast":
        weapon_additional_stamina_cost = 0;
        damage_attribute_mult = 0.5;
        break;
    case "moderate":
        weapon_additional_stamina_cost = 1;
        damage_attribute_mult = 1.0;
        break;
    case "slow":
        weapon_additional_stamina_cost = 2;
        damage_attribute_mult = 1.5;
        break;
    default:
        ui.notifications.error(weapon_name + " has invalide speed property");
        return;
}

if (weapon_atts.has_colossal) {
    if (weapon_atts.class !== "two-handed") {
        ui.notifications.error(weapon_name + " has colossal but is not two-handed");
        return;
    }
    damage_attribute_mult *= 2;
}

let disable_twf;
if (weapon_atts.class === "lightweight") {
    disable_offhand_attack = "";
} else {
    disable_offhand_attack = "disabled";
}
disable_offhand_attack = "";

let advantage_value = 0;
let attack_type;
let attack_stamina_cost;
let attack_damage_mult;

let custom_dialog = new Dialog({
    title: `${weapon_name} Attack Macro`,
    
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
        <div class="form-group" style="flex-direction: column;">
            <div class="flexrow" style="width: 100%;">
                <label>Hit modifier: </label>
                <label>Damage modifier: </label>
            </div>
            <div class="flexrow" style="width: 100%;">
                <input style="text-align:center; height: 100%;" id="misc_hit_mod" type="number" step="1" value="0" />
                <input style="text-align:center; height: 100%;" id="misc_damage_mod" type="number" step="1" value="0" />
            </div>
        </div>
        <div class="form-group" style="flex-direction: column;">
            <div style="width: 100%; flex-direction: row; padding-top: 5px;">
                <label style="text-align: center; vertical-align: middle;">Offhand Attack: </label>
                <input type="checkbox" id="offhand_attack" style="vertical-align: middle;" unchecked ${disable_offhand_attack} />
            </div>
        </div>

        <hr>
        </form>
        `,
    
    // Three buttons that set up our different attack types
    buttons: {
      quick: {
        label: `Quick Attack`,
        callback: () => {
            attack_type = "quick";
            attack_stamina_cost = 1;
            attack_damage_mult = 0.5;
        },
      },
      normal: {
        label: `Normal Attack`,
        callback: () => {
            attack_type = "normal";
            attack_stamina_cost = 2;
            attack_damage_mult = 1;
        },
      },
      power: {
        label: `Power Attack`,
        callback: () => {
            attack_type = "power";
            attack_stamina_cost = 3;
            attack_damage_mult = 1.5;
        },
      }
    },
    
    // Code that runs every time the dialog is rendered
    render: (html) => {
        //console.log("render callback func");
        
        // Update the advantage_value input element
        $("#advantage_value").val(advantage_value); // Have to update here, doing it in button funcs doesn't do anything
		
		$("#disadv_button").on("click", add_disadvantage);
		$("#adv_button").on("click", add_advantage);
		//html.find("#dec_button").on("click", dec_button_func); // Should do same thing as above
    },
    
    // The code to run once the prompt is exited via button press
    close: async (html) => {
        if (attack_type === undefined) return;
        
        // default input type is string, for some reason, so need to parseInt
        const final_advantage_value = parseInt($("#advantage_value").val());
        const misc_hit_mod = parseInt($("#misc_hit_mod").val());
        const misc_damage_mod = parseInt($("#misc_damage_mod").val());
        const offhand_attack = $("#offhand_attack").prop("checked");
        
        //console.log("Advantage value: " + final_advantage_value);
        //console.log("Attack type: " + attack_type);
        
        let attack_roll = final_advantage_value >= 0
            ? (3 + final_advantage_value) + "d8kh3" // Normal roll or roll with Advantage
            : (3 + (-1 * final_advantage_value)) + "d8kl3"; // Roll with Disadvantage
        //console.log(attack_roll);
        
        let final_attack_stamina_cost = offhand_attack
            ? 0
            : attack_stamina_cost + weapon_additional_stamina_cost;
        
        // Check if actor has enough stamina to make the attempted attack
        const remaining_stamina = token_atts.stamina - final_attack_stamina_cost;
        if (remaining_stamina < 0) {
            ui.notifications.error("Not enough Stamina to perform attack");
            return;
        }
        
        // Remove the stamina required to make the attack
        target_token.document._actor.update({
            "data.attributes.stamina.value": remaining_stamina,
        });
        //console.log(target_token);
        
        attack_damage_mult = offhand_attack
            ? attack_damage_mult * 0.5
            : attack_damage_mult;
        
        attack_roll = attack_roll + " + " + attribute_bonus + " + " + token_atts.strike + " + " + misc_hit_mod;
        let damage_roll = "max(floor((" + weapon_atts.damage_dice + " + floor(" + attribute_bonus + "*" + damage_attribute_mult + ") + " + misc_damage_mod + ") * " + attack_damage_mult + "), 1)";
        console.log(damage_roll);
    
        const attack = await (new Roll(attack_roll)).roll({async: true});
        //const attack_result = attack.result; // each piece of the roll kept separate, ex. "1d4+1d10" -> "2+7"
        //const attack_total = attack.total; // all results summed together
        //console.log("Attack: ", attack);
        //console.log("Attack Result: ", attack_result);
        //console.log("Attack Total: ", attack_total);
        const damage = await (new Roll(damage_roll)).roll({async: true});

        const attack_render = await attack.render();
        const damage_render = await damage.render();
        
        let chat_message_html = `
            <span style="float: left;">${token.data.name} ${attack_type} attacks with ${weapon_name}.</span></br>
            <span style="float: left;">Attack:</span></br>
            ${attack_render}
            <span style="float: left;">Damage:</span></br>
            ${damage_render}
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