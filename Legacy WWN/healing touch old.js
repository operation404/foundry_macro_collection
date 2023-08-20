const brad_actor = game.actors.find(actor => actor.data.name === "Aldin Conger");
let heal_data = brad_actor.getRollData();
heal_data.heal_item = brad_actor.data.items.find(i => i.data.type === "skill" && i.data.name === "Heal");
const heal_roll_string = "2d6 + @heal_item.data.data.ownedLevel + @details.level";
game.user.targets.forEach(target => {
    let heal_roll = new Roll(heal_roll_string, heal_data).roll().then(heal_roll => {
        if (target.actor.data.type === "character") {
            // handle PC
            if (target.actor.data.data.details.strain.value < target.actor.data.data.details.strain.max && target.actor.data.data.hp.value < target.actor.data.data.hp.max) {
                
                const old_hp = target.actor.data.data.hp.value;
                const new_hp = old_hp + heal_roll.total > target.actor.data.data.hp.max ? target.actor.data.data.hp.max : old_hp + heal_roll.total;
                const old_strain = target.actor.data.data.details.strain.value;
                
                apply_healing(target.id, new_hp, old_strain+1);
                
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

                apply_healing(target.id, new_hp);
                
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

function apply_healing(token_id, new_hp, new_strain) {
    try {
        Boneyard.executeAsGM_wrapper((args)=>{
            
            const token = canvas.tokens.documentCollection.get(args.token_id);
            if (token === undefined) {
                ui.notifications.error(`No token for id '${args.token_id}'`);
                return;
            }

            if (args.new_strain === undefined) {
                token.actor.update({
                    "data.hp.value": args.new_hp
                }); 
            } else {
                token.actor.update({
                    "data.hp.value": args.new_hp,
                    "data.details.strain.value": args.new_strain
                });    
            }

        }, { 
            token_id: token_id, 
            new_hp: new_hp, 
            new_strain: new_strain
        });
    } catch(e) {
        console.error(e);
        if (e.name === "SocketlibNoGMConnectedError") {
            console.log("Error: Can't run 'Healing Touch' macro, no GM client available.");
            ui.notifications.error("Error: Can't run 'Healing Touch' macro, no GM client available.");
        } else {
            console.log("Error: " + e.message);
            ui.notifications.error("Error: " + e.message);
        }
        return;
    }
}