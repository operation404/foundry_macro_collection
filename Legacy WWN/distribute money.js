const party_actor = game.actors.get("UjwAEFk2K9bC9nJu"); // Party actor id
let pc_actors = [];
pc_actors.push(game.actors.find(actor => actor.data.name === "Rosaria Synn"));
pc_actors.push(game.actors.find(actor => actor.data.name === "Kazem Sahaba"));
pc_actors.push(game.actors.find(actor => actor.data.name === "Aldin Conger"));
pc_actors.push(game.actors.find(actor => actor.data.name === "Shelley"));
pc_actors.push(game.actors.find(actor => actor.data.name === "Siwa Chekov"));
console.log(pc_actors);

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
        let player_count = pc_actors.length;
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
        
        
 
        console.log(JSON.parse(JSON.stringify(player_share_array)));
        console.log("spare gp: " + spare_gold);
        console.log("spare sp: " + spare_silver);
        console.log("spare cp: " + spare_copper);
        
        pc_actors.forEach((actor, index) => {
            let pc_currency = actor.data.data.currency;
            let share = player_share_array[index];
            actor.update({
                "data.currency.cp": pc_currency.cp + share.cp,
                "data.currency.sp": pc_currency.sp + share.sp,
                "data.currency.gp": pc_currency.gp + share.gp,
            });
        });
        
        party_actor.update({
            "data.currency.cp": currency.cp + spare_copper,
            "data.currency.sp": currency.sp + spare_silver,
            "data.currency.gp": currency.gp + spare_gold,
        });

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
          
        pc_actors.forEach((actor, index) => {
            let share = player_share_array[index];
            chat_output_html += `<span>${actor.data.name} gets: ${share.gp}gp ${share.sp}sp ${share.cp}cp`;
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