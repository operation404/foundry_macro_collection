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
    title:`Add Money to Players`,
    content: `
        <form>
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Copper: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="copper" type="number" step="0.1" value="0" />
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px; padding-right: 10px;">Silver: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="silver" type="number" step="0.1" value="0" />
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px; padding-right: 10px;">Gold: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="gold" type="number" step="0.1" value="0" />
                <div></div>
            </div>
            <hr>
        </form>
    `,
    buttons: {
        distribute: {
            label: `Distribute`,
            callback: () => {
                button_hit = true;
            }
        },
    },
    
    default: "distribute",
    
    render: (html) => {}, // Do html value updating and hooking here
    
    close: async (html) => {
        if (button_hit !== true) return;

        let copper = parseFloat($("#copper").val());
        let silver = parseFloat($("#silver").val());
        let gold = parseFloat($("#gold").val());
        
        // extra precaution to prevent subtracting money
        copper = copper > 0 ? copper : 0;
        silver = silver > 0 ? silver : 0;
        gold = gold > 0 ? gold : 0;

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
                    let currency = actor.data.data.currency;
                    actor.update({
                        "data.currency.cp": currency.cp + args.copper,
                        "data.currency.sp": currency.sp + args.silver,
                        "data.currency.gp": currency.gp + args.gold,
                    });
                });
                
            }, { 
                names: pc_actor_names, 
                copper: copper, 
                silver: silver, 
                gold: gold 
            });
        } catch(e) {
            console.error(e);
            if (e.name === "SocketlibNoGMConnectedError") {
                console.log("Error: Can't run 'Distribute Money' macro, no GM client available.");
                ui.notifications.error("Error: Can't run 'Distribute Money' macro, no GM client available.");
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
            <span>Players receive money ${current_day} of ${current_month}, ${current_year}</span><br>
            <span>Each PC receives: <b>${copper}cp ${silver}sp ${gold}gp</b></span><br>
        `;
        
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({actor: party_actor}),
            content: chat_output_html
        });
    },
});

custom_dialog.render(force = true, options = {width: 450});