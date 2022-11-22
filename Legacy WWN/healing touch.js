const brad_actor = game.actors.find(actor => actor.data.name === "Aldin Conger");
const heal_roll_string = "2d6 + @skills.heal.value + @details.level";
game.user.targets.forEach(target => {
    let heal_roll = new Roll(heal_roll_string, brad_actor.getRollData()).roll().then(heal_roll => {
        if (target.actor.data.type === "character") {
            // handle PC
            if (target.actor.data.data.details.strain.value < target.actor.data.data.details.strain.max && target.actor.data.data.hp.value < target.actor.data.data.hp.max) {
                
                const old_hp = target.actor.data.data.hp.value;
                const new_hp = old_hp + heal_roll.total > target.actor.data.data.hp.max ? target.actor.data.data.hp.max : old_hp + heal_roll.total;
                const old_strain = target.actor.data.data.details.strain.value;
                
                target.actor.update({
                    "data.hp.value": new_hp,
                    "data.details.strain.value": old_strain + 1
                });
                
                heal_roll.render().then(heal_render => {
                    ChatMessage.create({
                        user: game.user._id,
                        speaker: ChatMessage.getSpeaker({token: target.document}),
                        content: `<span>${target.name} is healed!</span><br>
                                    ${heal_render}
                                    <span><b style="color:green;">${old_hp}</b> hp &#8594; <b style="color:green;">${new_hp}</b> hp</span><br>
                                    <span><b style="color:maroon;">${old_strain}</b> strain &#8594; <b style="color:maroon;">${old_strain+1}</b> strain</span><br>
                                    `
                    });   
                });
            }
        } else {
            // handle NPC, disposition of 1 is friendly
            if (target.actor.data.data.hp.value < target.actor.data.data.hp.max && target.data.disposition === 1) {
                const old_hp = target.actor.data.data.hp.value;
                const new_hp = old_hp + heal_roll.total > target.actor.data.data.hp.max ? target.actor.data.data.hp.max : old_hp + heal_roll.total;

                target.actor.update({
                    "data.hp.value": new_hp,
                });
                
                heal_roll.render().then(heal_render => {
                    ChatMessage.create({
                        user: game.user._id,
                        speaker: ChatMessage.getSpeaker({token: target.document}),
                        content: `<span>${target.name} is healed!</span><br>
                                    ${heal_render}
                                    <span><b style="color:green;">${old_hp}</b> hp &#8594; <b style="color:green;">${new_hp}</b> hp</span><br>
                                    `
                    });   
                });
            }
        }
    });
});