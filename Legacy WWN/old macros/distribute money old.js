const party_actor = game.actors.get("UjwAEFk2K9bC9nJu"); // Party actor id
const party_actor_id = "UjwAEFk2K9bC9nJu";
const pc_actor_names = [
    "Rosaria Synn",
    "Kazem Sahaba",
    "Aldin Conger",
    "Shelley",
    "Siwa Chekov"
];

let currency = party_actor.data.data.currency;
let treasure = party_actor.data.data.treasure;
let current_party_fund = +(Math.max(currency.total - treasure, 0)).toFixed(1);
let button_hit = false;

let custom_dialog = new Dialog({
    title:`Distribute Money`,
    
    content: `
        <form>
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Party fund: <b>${current_party_fund}</b> (${currency.cp}cp ${currency.sp}sp ${currency.gp}gp)</label>
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Party share ratio: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="party_fund_ratio" type="number" step="0.01" value="0.5" />
                <div></div>
            </div>
            <hr>
            
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
        
        let party_fund_ratio = parseFloat($("#party_fund_ratio").val());
        // ensure ratio is between 0 and 1
        party_fund_ratio = party_fund_ratio < 0 ? 0 : party_fund_ratio;
        party_fund_ratio = party_fund_ratio > 1 ? 1 : party_fund_ratio;
        let copper = parseFloat($("#copper").val());
        let silver = parseFloat($("#silver").val());
        let gold = parseFloat($("#gold").val());
        // extra precaution to prevent subtracting money
        copper = copper > 0 ? copper : 0;
        silver = silver > 0 ? silver : 0;
        gold = gold > 0 ? gold : 0;
        let player_count = pc_actor_names.length;
        let total_in_copper = copper + silver*10 + gold*100;
        let player_share = Math.ceil(total_in_copper / (player_count / (1 - party_fund_ratio)));
        let player_share_array = Array(player_count).fill().map(u => ({
            cp: 0, sp: 0, gp: 0,
            remaining: player_share,
        }));
        
        let remainder = 0;
        // handle gold distribution
        player_share_array.forEach((player, index) => {
            let available = Math.floor(gold / player_count) + (index+1 <= gold % player_count ? 1 : 0) + remainder;
            let needed = (player.remaining - (player.remaining%100))/100;
            let player_gets = available - needed <= 0 ? available : needed;
            remainder = available - player_gets;
            player.gp = player_gets;
            player.remaining -= player_gets*100;
        });
        let spare_gold = remainder;
        
        remainder = 0;
        // handle silver distribution
        player_share_array.forEach((player, index) => {
            let available = Math.floor(silver / player_count) + (index+1 <= silver % player_count ? 1 : 0) + remainder;
            let needed = (player.remaining - (player.remaining%10))/10;
            let player_gets = available - needed <= 0 ? available : needed;
            remainder = available - player_gets;
            player.sp = player_gets;
            player.remaining -= player_gets*10;
        });
        let spare_silver = remainder;
        
        remainder = 0;
        // handle silver distribution
        player_share_array.forEach((player, index) => {
            let available = Math.floor(copper / player_count) + (index+1 <= copper % player_count ? 1 : 0) + remainder;
            let needed = player.remaining;
            let player_gets = available - needed <= 0 ? available : needed;
            remainder = available - player_gets;
            player.cp = player_gets;
            player.remaining -= player_gets;
        });
        let spare_copper = remainder;
        remainder = 0;
        
        // TODO Check if any person is still missing money after
        // this might be fixable, for now I'll alert it in the
        // output message building section
       
        //console.log(JSON.parse(JSON.stringify(player_share_array)));
        //console.log("spare gp: " + spare_gold);
        //console.log("spare sp: " + spare_silver);
        //console.log("spare cp: " + spare_copper);
        
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
                
                actors.forEach((actor, index) => {
                    let currency = actor.data.data.currency;
                    let share = args.shares[index];
                    actor.update({
                        "data.currency.cp": currency.cp + share.cp,
                        "data.currency.sp": currency.sp + share.sp,
                        "data.currency.gp": currency.gp + share.gp,
                    });
                });
                
                let party_actor = game.actors.get(args.party_actor_id);
                if (party_actor === undefined) {
                    const e = new Error(`ID '${args.party_actor_id}' does not correspond to an actor.`);
                    e.name = "UndefinedActor";
                    throw e;
                } 
                let currency = party_actor.data.data.currency;
                party_actor.update({
                    "data.currency.cp": currency.cp + args.spare_copper,
                    "data.currency.sp": currency.sp + args.spare_silver,
                    "data.currency.gp": currency.gp + args.spare_gold,
                });
            }, { 
                party_actor_id: party_actor_id,
                names: pc_actor_names, 
                shares: player_share_array,
                spare_copper: spare_copper,
                spare_silver: spare_silver,
                spare_gold: spare_gold
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
        
        let new_party_fund = current_party_fund + spare_gold*10 + spare_silver + (+(spare_copper/10).toFixed(1));
        
        let chat_output_html = `
            <span>Money distribution ${current_day} of ${current_month}, ${current_year}</span><br>
            <span>Money to distribute: ${gold}gp ${silver}sp ${copper}cp</span><br>
        `;
          
        pc_actor_names.forEach((name, index) => {
            let share = player_share_array[index];
            chat_output_html += `<span>${name} gets: ${share.gp}gp ${share.sp}sp ${share.cp}cp`;
            if (share.remaining > 0) {
                chat_output_html += ` (short ${+(share.remaining/10).toFixed(1)}sp)`;
            }
            chat_output_html += `</span><br>`;
        });
            
        chat_output_html += `
            <span>Party fund gets: ${spare_gold}gp ${spare_silver}sp ${spare_copper}cp</span><br>
            <span>Party fund: ${current_party_fund} &#8594; ${new_party_fund}</span><br>
        `;
        
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({actor: party_actor}),
            content: chat_output_html
        });
    },
});

custom_dialog.render(force = true, options = {width: 500});