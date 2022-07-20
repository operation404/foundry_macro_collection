// This method also works but relies on searching the whole 
// collection to find the actor by its name
//const party_actor = game.actors.find(actor => actor.data.name === "Party");
const party_actor = game.actors.get("UjwAEFk2K9bC9nJu"); // Party actor id

let party_items = party_actor.data.items; //EmbeddedCollection, not an array
let rations = party_items.find(item => item.data.name === "Rations");
let water = party_items.find(item => item.data.name === "Water");
let animal_feed = party_items.find(item => item.data.name === "Animal Feed");
let currency = party_actor.data.data.currency;
let treasure = party_actor.data.data.treasure;
let stowed_encumbrance = party_actor.data.data.encumbrance.stowed;

let purchase_confirmed = false;
let price_rations = rations.data.data.price;
let price_feed = animal_feed.data.data.price;
let price_water = water.data.data.price;
let purchase_rations = 0;
let purchase_feed = 0;
let purchase_water = 0;
let calc_cost = 0;
let calc_encumbrance = parseFloat(stowed_encumbrance.value);

let custom_dialog = new Dialog({
    title:`Restock Food and Supplies`,
    
    content: `
        <form>
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;"><b>Money: ${+(Math.max(currency.total - treasure, 0)).toFixed(1)} (${currency.cp}cp ${currency.sp}sp ${currency.gp}gp)</b></label>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;"><b>Rations: ${rations.data.data.quantity}</b></label>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;"><b>Animal feed: ${animal_feed.data.data.quantity}</b></label>
                <label style="white-space: nowrap; flex-grow: 0;"><b>Water: ${water.data.data.quantity}</b></label>
                <div></div>
            </div>
            <hr>
            
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Buy rations: </label>
                <button style="flex-grow: 0; line-height: normal; min-width: 40px;" id="rations_minus_button" title="Click to subtract 1. Shift-click to subtract 10.">-</button>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="purchase_rations" type="number" step="1" min="0" value="${purchase_rations}" />
                <button style="flex-grow: 0; line-height: normal; min-width: 40px;" id="rations_add_button" title="Click to add 1. Shift-click to add 10.">+</button>
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px; padding-right: 10px;">Unit cost: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="rations_cost" type="number" step="0.1" value="${price_rations}" />
                <div></div>
            </div>
            
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 26px;">Buy feed: </label>
                <button style="flex-grow: 0; line-height: normal; min-width: 40px;" id="feed_minus_button" title="Click to subtract 1. Shift-click to subtract 10.">-</button>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="purchase_feed" type="number" step="1" min="0" value="${purchase_feed}" />
                <button style="flex-grow: 0; line-height: normal; min-width: 40px;" id="feed_add_button" title="Click to add 1. Shift-click to add 10.">+</button>
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px; padding-right: 10px;">Unit cost: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="feed_cost" type="number" step="0.1" value="${price_feed}" />
                <div></div>
            </div>
      
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 18px;">Buy water: </label>
                <button style="flex-grow: 0; line-height: normal; min-width: 40px;" id="water_minus_button" title="Click to subtract 1. Shift-click to subtract 10.">-</button>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="purchase_water" type="number" step="1" min="0" value="${purchase_water}" />
                <button style="flex-grow: 0; line-height: normal; min-width: 40px;" id="water_add_button" title="Click to add 1. Shift-click to add 10.">+</button>
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px; padding-right: 10px;">Unit cost: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="water_cost" type="number" step="0.1" value="${price_water}" />
                <div></div>
            </div>
      
            <hr>
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0;"><b>Stowed capacity: </b></label>
                <span style="text-align: center; height: 100%; margin: 0px 8px 0px 8px; font-weight: bold; font-style: italic; border: groove; min-width: 80px; flex-grow: 0;" id="calc_encumbrance">${calc_encumbrance}</span>
                <label style="white-space: nowrap; flex-grow: 0;"><b> / ${stowed_encumbrance.max}</b></label>
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 20px;"><b>Cost:</b></label>
                <span style="text-align: center; height: 100%; margin: 0px 8px 0px 8px; font-weight: bold; font-style: italic; border: groove; min-width: 80px; flex-grow: 0;" id="calc_cost">${calc_cost}</span>
                <label style="white-space: nowrap; flex-grow: 0;"><b>sp</b></label>
                <div></div>
            </div>
            <hr>
        </form>
    `,
    buttons: {
        purchase: {
            label: `Purchase`,
            callback: () => {
                purchase_confirmed = true;
            }
        },
    },
    
    default: "purchase",
    
    render: (html) => {
        // Hook anonymous functions onto button clicks and textbox inputs
        $("#rations_minus_button").on("click", (e) => {
            if (e.shiftKey) {purchase_rations -= 10;} else {purchase_rations -= 1;}
            purchase_rations = purchase_rations < 0 ? 0 : purchase_rations;
            custom_dialog.render();
        });
        $("#rations_add_button").on("click", (e) => {
            if (e.shiftKey) {purchase_rations += 10;} else {purchase_rations += 1;}
            custom_dialog.render();
        });
        $("#feed_minus_button").on("click", (e) => {
            if (e.shiftKey) {purchase_feed -= 10;} else {purchase_feed -= 1;}
            purchase_feed = purchase_feed < 0 ? 0 : purchase_feed;
            custom_dialog.render();
        });
        $("#feed_add_button").on("click", (e) => {
            if (e.shiftKey) {purchase_feed += 10;} else {purchase_feed += 1;}
            custom_dialog.render();
        });
        $("#water_minus_button").on("click", (e) => {
            if (e.shiftKey) {purchase_water -= 10;} else {purchase_water -= 1;}
            purchase_water = purchase_water < 0 ? 0 : purchase_water;
            custom_dialog.render();
        });
        $("#water_add_button").on("click", (e) => {
            if (e.shiftKey) {purchase_water += 10;} else {purchase_water += 1;}
            custom_dialog.render();
        });
        $("#purchase_rations").on("change", (e) => {
            purchase_rations = parseFloat(e.target.value);
            purchase_rations = purchase_rations < 0 ? 0 : purchase_rations;
            purchase_rations = Math.floor(purchase_rations);
            custom_dialog.render();
        });
        $("#purchase_feed").on("change", (e) => {
            purchase_feed = parseFloat(e.target.value);
            purchase_feed = purchase_feed < 0 ? 0 : purchase_feed;
            purchase_feed = Math.floor(purchase_feed);
            custom_dialog.render();
        });
        $("#purchase_water").on("change", (e) => {
            purchase_water = parseFloat(e.target.value);
            purchase_water = purchase_water < 0 ? 0 : purchase_water;
            purchase_water = Math.floor(purchase_water);
            custom_dialog.render();
        });
        $("#rations_cost").on("change", (e) => {
            price_rations = parseFloat(e.target.value);
            price_rations = price_rations < 0 ? 0 : price_rations;
            price_rations = +(price_rations).toFixed(1);
            custom_dialog.render();
        });
        $("#feed_cost").on("change", (e) => {
            price_feed = parseFloat(e.target.value);
            price_feed = price_feed < 0 ? 0 : price_feed;
            price_feed = +(price_feed).toFixed(1);
            custom_dialog.render();
        });
        $("#water_cost").on("change", (e) => {
            price_water = parseFloat(e.target.value);
            price_water = price_water < 0 ? 0 : price_water;
            price_water = +(price_water).toFixed(1);
            custom_dialog.render();
        });
        
        $("#purchase_rations").val(purchase_rations);
        $("#purchase_feed").val(purchase_feed);
        $("#purchase_water").val(purchase_water);
        $("#rations_cost").val(price_rations);
        $("#feed_cost").val(price_feed);
        $("#water_cost").val(price_water);
        
        calc_encumbrance = parseFloat(stowed_encumbrance.value) + 
            purchase_rations*rations.data.data.weight + 
            purchase_feed*animal_feed.data.data.weight + 
            purchase_water*water.data.data.weight;
        calc_encumbrance = +(calc_encumbrance).toFixed(2);
       
        calc_cost = purchase_rations*price_rations + purchase_feed*price_feed + purchase_water*price_water;
        calc_cost = +(calc_cost).toFixed(2);
        
        // These are <span> elements so need to update text, not value
        $("#calc_encumbrance").text(calc_encumbrance);
        $("#calc_cost").text(calc_cost);
    }, 
    
    close: async (html) => {
        if (!purchase_confirmed) return;
        
        let old_ration_quantity = rations.data.data.quantity;
        let old_feed_quantity = animal_feed.data.data.quantity;
        let old_water_quantity = water.data.data.quantity;
        let new_rations_quantity = old_ration_quantity + purchase_rations;
        let new_feed_quantity = old_feed_quantity + purchase_feed;
        let new_water_quantity = old_water_quantity + purchase_water;
        let old_encumbrance = parseFloat(stowed_encumbrance.value);
        
        let new_currency = {cp: currency.cp, sp: currency.sp, gp: currency.gp};
        let cost_in_copper = Math.floor(calc_cost * 10);
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
        
        let chat_output_html;
        if (cost_in_copper > 0) {
            // Not enough money to buy supplies
            chat_output_html = `
               <span>!!! Not enough money to buy supplies !!!</span>
            `;
        } else {
            rations.update({"data.quantity": new_rations_quantity});
            animal_feed.update({"data.quantity": new_feed_quantity});
            water.update({"data.quantity": new_water_quantity});
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
               <span>Supply Restock ${current_day} of ${current_month}, ${current_year}</span><br>
               <span>Rations: ${old_ration_quantity} &#8594; ${new_rations_quantity}</span><br>
               <span>Feed: ${old_feed_quantity} &#8594; ${new_feed_quantity}</span><br>
               <span>Water: ${old_water_quantity} &#8594; ${new_water_quantity}</span><br>
               <span>Stowed capacity: ${old_encumbrance} / ${stowed_encumbrance.max} &#8594; ${calc_encumbrance} / ${stowed_encumbrance.max}</span><br>
               <span>Cost: ${calc_cost} sp</span>
            `;
        }
        
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({actor: party_actor}),
            content: chat_output_html
        });
    },
});

custom_dialog.render(force = true, options = {width: 550});