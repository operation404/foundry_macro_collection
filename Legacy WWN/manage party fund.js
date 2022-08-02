const party_actor = game.actors.get("UjwAEFk2K9bC9nJu"); // Party actor id

let add_or_spend;
let currency = party_actor.data.data.currency;
let treasure = party_actor.data.data.treasure;

let custom_dialog = new Dialog({
    title:`Manage Party Fund`,
    content: `
        <form>
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Party fund: <b>${+(Math.max(currency.total - treasure, 0)).toFixed(1)}</b> (${currency.cp}cp ${currency.sp}sp ${currency.gp}gp)</label>
                <div></div>
            </div>
            <hr>
            
            <label style="white-space: nowrap; flex-grow: 0;">Add money: </label>
            
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
            
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Spend money: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="spend" type="number" step="0.1" value="0" />
                <div></div>
            </div>
            
            <hr>
        </form>
    `,
    buttons: {
        add: {
            label: `Add`,
            callback: () => {
                add_or_spend = "add";
            }
        },
        spend: {
            label: `Spend`,
            callback: () => {
                add_or_spend = "spend";
            }
        },
    },
    
    render: (html) => {}, // Do html value updating and hooking here
    
    close: async (html) => {
        if (add_or_spend === undefined) return;
        
        let chat_output_html;
        
        if (add_or_spend === "add") {
            let copper = parseFloat($("#copper").val());
            let silver = parseFloat($("#silver").val());
            let gold = parseFloat($("#gold").val());
            
            party_actor.update({
                "data.currency.cp": currency.cp + copper,
                "data.currency.sp": currency.sp + silver,
                "data.currency.gp": currency.gp + gold,
            });
            
            // the 'currency' object should still have old values even after
            // calling update on the actor
            chat_output_html = `
            <span>Party fund adds money: <b>${copper}cp ${silver}sp ${gold}gp</b></span><br>
            <span>cp: ${currency.cp} &#8594; ${currency.cp + copper}</span><br>
            <span>sp: ${currency.sp} &#8594; ${currency.sp + silver}</span><br>
            <span>gp: ${currency.gp} &#8594; ${currency.gp + gold}</span><br>
            <span>Total fund: ${+((currency.cp + copper)/10).toFixed(1) + (currency.sp + silver) + (currency.gp + gold)*10}</span><br>
            `;
            
        } else {
            let spend_amount = parseFloat($("#spend").val());    
            let new_currency = {cp: currency.cp, sp: currency.sp, gp: currency.gp};
            let cost_in_copper = Math.floor(spend_amount * 10);
            let left_over;
            
            // Attempt to pay with just copper first
            left_over = currency.cp - cost_in_copper;
            left_over = left_over > 0 ? left_over : 0;
            new_currency.cp = left_over;
            cost_in_copper -= currency.cp;
            
            if (cost_in_copper > 0) {
                // Attempt to pay with silver if there's still cost remaining
                left_over = currency.sp*10 - cost_in_copper;
                left_over = left_over > 0 ? left_over : 0;
                new_currency.cp = left_over % 10;
                new_currency.sp = Math.floor(left_over/10);
                cost_in_copper -= currency.sp*10;
                
                if (cost_in_copper > 0) {
                    // Attempt to pay with gold if there's still cost remaining
                    left_over = currency.gp*100 - cost_in_copper;
                    left_over = left_over > 0 ? left_over : 0;
                    new_currency.cp = left_over % 10;
                    new_currency.sp = Math.floor(left_over/10) % 10;
                    new_currency.gp = Math.floor(left_over/100);
                    cost_in_copper -= currency.gp*100;
                }
            }
            
            if (cost_in_copper > 0) {
                // Not enough money to spend
                chat_output_html = `
                   <span>!!! Not enough money !!!</span>
                `;
            } else {
                party_actor.update({
                    "data.currency.cp": new_currency.cp,
                    "data.currency.sp": new_currency.sp,
                    "data.currency.gp": new_currency.gp,
                });
                
                let current_day = SimpleCalendar.api.getCurrentDay().numericRepresentation;
                current_day = current_day == 1 ? ""+current_day+"st"
                            : current_day == 2 ? ""+current_day+"nd"
                            : current_day == 3 ? ""+current_day+"rd"
                            : ""+current_day+"th";
                let current_month = SimpleCalendar.api.getCurrentMonth().name;
                let current_year = SimpleCalendar.api.getCurrentYear().numericRepresentation;
                
                chat_output_html = `
                <span>Party fund spends money ${current_day} of ${current_month}, ${current_year}</span><br>
                <span>Amount spent: <b>${spend_amount}</b></span><br>
                <span>cp: ${currency.cp} &#8594; ${new_currency.cp}</span><br>
                <span>sp: ${currency.sp} &#8594; ${new_currency.sp}</span><br>
                <span>gp: ${currency.gp} &#8594; ${new_currency.gp}</span><br>
                <span>Total fund: ${+((currency.cp)/10).toFixed(1) + (currency.sp) + (currency.gp)*10} &#8594; ${+((new_currency.cp)/10).toFixed(1) + (new_currency.sp) + (new_currency.gp)*10}</span><br>
                `;
            }
        }
        
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({actor: party_actor}),
            content: chat_output_html
        });
    },
});

custom_dialog.render(force = true, options = {width: 450});