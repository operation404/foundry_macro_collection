const party_actor = game.actors.get("UjwAEFk2K9bC9nJu"); // Party actor id
let pc_actor_names = [
    "Rosaria Synn",
    "Kazem Sahaba",
    "Aldin Conger",
    "Shelley",
    "Siwa Chekov"
];

let button_hit = false;

let custom_dialog = new Dialog({
    title:`Apply XP and Renown`,
    content: `
        <form>
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Experience: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="experience" type="number" step="0.1" value="0" min="0" />
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px; padding-right: 10px;">Renown: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="renown" type="number" step="0.1" value="0" min="0" />
                <div></div>
            </div>
            <hr>
        </form>
    `,
    buttons: {
        add: {
            label: `Add`,
            callback: () => {
                button_hit = true;
            }
        },
    },
    
    default: "add",
    
    render: (html) => {}, // Do html value updating and hooking here
    
    close: async (html) => {
        if (button_hit !== true) return;
    
        let exp = parseFloat($("#experience").val());
        let renown = parseFloat($("#renown").val());
        exp = exp < 0 ? 0 : exp;
        renown = renown < 0 ? 0 : renown;

        try {
            await Boneyard.executeAsGM_wrapper((args)=>{
                
                let actors = [];
                args.names.forEach(name => {
                    let actor = game.actors.find(actor => actor.data.name === name);
                    if (actor === undefined) {
                        const e = new Error(`Name '${name}' does not correspond to an actor.`);
                        e.name = "UndefinedActor";
                        throw e;
                    } 
                    actors.push(actor);
                });
                
                actors.forEach(actor => {
                    actor.update({
                        "data.details.xp.value": actor.data.data.details.xp.value + args.exp,
                        "data.details.renown.value": actor.data.data.details.renown.value + args.renown
                    });
                });
                
            }, { 
                names: pc_actor_names, 
                exp: exp, 
                renown: renown 
            });
        } catch(e) {
            console.error(e);
            if (e.name === "SocketlibNoGMConnectedError") {
                console.log("Error: Can't run 'Apply XP and Renown' macro, no GM client available.");
                ui.notifications.error("Error: Can't run 'Apply XP and Renown' macro, no GM client available.");
            } else {
                console.log("Error: " + e.message);
                ui.notifications.error("Error: " + e.message);
            }
            return;
        }
        
        let current_day = SimpleCalendar.api.getCurrentDay().numericRepresentation;
        current_day = current_day == 1 ? ""+current_day+"st"
                    : current_day == 2 ? ""+current_day+"nd"
                    : current_day == 3 ? ""+current_day+"rd"
                    : ""+current_day+"th";
        let current_month = SimpleCalendar.api.getCurrentMonth().name;
        let current_year = SimpleCalendar.api.getCurrentYear().numericRepresentation;
        
        let chat_output_html = `
            <span>Players gain XP and Renown ${current_day} of ${current_month}, ${current_year}</span><br>
            <span>Each PC receives: <b>${exp} XP and ${renown} Renown</b></span><br>
        `;
        
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({actor: party_actor}),
            content: chat_output_html
        });
    },
});

custom_dialog.render(force = true, options = {width: 450});