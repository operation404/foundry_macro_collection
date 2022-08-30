// This method also works but relies on searching the whole 
// collection to find the actor by its name
//const party_actor = game.actors.find(actor => actor.data.name === "Party");
const party_actor = game.actors.get("UjwAEFk2K9bC9nJu"); // Party actor id

let party_size = party_actor.data.data.attributes.party_size.value;
let small_pack_animals = party_actor.data.data.attributes.small_pack_animals.value;
let large_pack_animals = party_actor.data.data.attributes.large_pack_animals.value;

let party_items = party_actor.data.items; //EmbeddedCollection, not an array
let rations = party_items.find(item => item.data.name === "Rations");
let water = party_items.find(item => item.data.name === "Water");
let animal_feed = party_items.find(item => item.data.name === "Animal Feed");

const hot_climate_water_mult = 2;

let est_rations = party_size;
let est_feed = (small_pack_animals*2) + (large_pack_animals*4);
let est_water = (small_pack_animals*4) + (large_pack_animals*8) + party_size;
let est_water_hot = est_water*hot_climate_water_mult;
// +(~~~).toFixed(2) rounds to 2 decimals, the + drops extra 0's and converts from string to number
let calc_rations = +(rations.data.data.quantity / est_rations).toFixed(2); 
let calc_feed = +(animal_feed.data.data.quantity / est_feed).toFixed(2); 
let calc_water = +(water.data.data.quantity / est_water).toFixed(2); 
let calc_water_hot = +(water.data.data.quantity / est_water_hot).toFixed(2); 

let water_multiplier;
let days = 1;

let custom_dialog = new Dialog({
    title:`Daily Travel Resource Consumption`,
    
    content: `
        <form>
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;"><b>Rations: ${rations.data.data.quantity}</b></label>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;"><b>Animal feed: ${animal_feed.data.data.quantity}</b></label>
                <label style="white-space: nowrap; flex-grow: 0;"><b>Water: ${water.data.data.quantity}</b></label>
                <div></div>
            </div>
            
            <div>
                <label style="white-space: nowrap; padding-right: 10px;">Rations used per day: ${est_rations}</label>
                <label style="white-space: nowrap;">Days remaining: ${calc_rations}</label>
            </div>
            
            <div>
                <label style="white-space: nowrap; padding-right: 10px;">Feed used per day: ${est_feed}</label>
                <label style="white-space: nowrap;">Days remaining: ${calc_feed}</label>
            </div>
            
            <div>
                <label style="white-space: nowrap; padding-right: 10px;">Water used per day: ${est_water}</label>
                <label style="white-space: nowrap;">Days remaining: ${calc_water}</label>
            </div>
            
            <div>
                <label style="white-space: nowrap; padding-right: 10px;">Hot climate water used: ${est_water_hot}</label>
                <label style="white-space: nowrap;">Days remaining: ${calc_water_hot}</label>
            </div>
            
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Days: </label>
                <button style="flex-grow: 0; line-height: normal; min-width: 40px;" id="days_minus_button" title="Click to subtract 1. Shift-click to subtract 7.">-</button>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="days" type="number" step="1" min="0" value="${days}" />
                <button style="flex-grow: 0; line-height: normal; min-width: 40px;" id="days_add_button" title="Click to add 1. Shift-click to add 7.">+</button>
                <div></div>
            </div>
            
            <hr>
        </form>
    `,
    buttons: {
        none: {
            label: `No Water`,
            callback: () => {
                water_multiplier = 0;
            }
        },
        normal: {
            label: `Standard Water`,
            callback: () => {
                water_multiplier = 1;
            }
        },
        hot: {
            label: `Hot Climate Water`,
            callback: () => {
                water_multiplier = hot_climate_water_mult;
            }
        }
    },
    
    default: "none",
    
    render: (html) => {
        
        //const update_computed_fields = () => {};
        
        $("#days_add_button").on("click", (e) => {
            if (e.shiftKey) {days += 7;} else {days += 1;}
            $("#days").val(days);
            //update_computed_fields();
        });
        $("#days_minus_button").on("click", (e) => {
            if (e.shiftKey) {days -= 7;} else {days -= 1;}
            days = days < 0 ? 0 : days;
            $("#days").val(days);
            //update_computed_fields();
        });
        
        
    }, // Do html value updating and hooking here
    
    close: async (html) => {
        if (water_multiplier === undefined) return;
        
        days = $("#days").val();

        let old_rations_quantity = rations.data.data.quantity;
        let old_feed_quantity = animal_feed.data.data.quantity;
        let old_water_quantity = water.data.data.quantity;
        let new_rations_quantity = old_rations_quantity - (est_rations * days);
        let new_feed_quantity = old_feed_quantity - (est_feed * days);
        let new_water_quantity = old_water_quantity - (est_water * water_multiplier * days);
        
        let insufficient_rations = "";
        let rations_output = new_rations_quantity;
        if (new_rations_quantity < 0) {
            insufficient_rations = `<span>!!! Short ${-new_rations_quantity} rations !!!</span><br>`;
            new_rations_quantity = 0;
            rations_output = `<b style="color:#FF0000;">0</b>`;
        }
        
        let insufficient_feed = "";
        let feed_output = new_feed_quantity;
        if (new_feed_quantity < 0) {
            insufficient_feed = `<span>!!! Short ${-new_feed_quantity} feed !!!</span><br>`;
            new_feed_quantity = 0;
            feed_output = `<b style="color:#FF0000;">0</b>`;
        }
        
        let insufficient_water = "";
        let water_output = new_water_quantity;
        if (new_water_quantity < 0) {
            insufficient_water = `<span>!!! Short ${-new_water_quantity} water !!!</span><br>`;
            new_water_quantity = 0;
            water_output = `<b style="color:#FF0000;">0</b>`;
        }
        
        // Update ration/feed/water items with new values
        rations.update({"data.quantity": new_rations_quantity});
        animal_feed.update({"data.quantity": new_feed_quantity});
        water.update({"data.quantity": new_water_quantity});
        
        // Using SimpleCalendar for time management instead of the normal foundry object
        //game.time.advance(86400); // 86400 = seconds in 1 day
        
        let old_day = SimpleCalendar.api.getCurrentDay().numericRepresentation;
        old_day = old_day == 1 ? ""+old_day+"st"
                    : old_day == 2 ? ""+old_day+"nd"
                    : old_day == 3 ? ""+old_day+"rd"
                    : ""+old_day+"th";
        let old_month = SimpleCalendar.api.getCurrentMonth().name;
        let old_year = SimpleCalendar.api.getCurrentYear().numericRepresentation;
        
        try {
            await Boneyard.executeAsGM_wrapper((args)=>{
                // advance the calendar by however many days
                SimpleCalendar.api.changeDate({day: args.days_to_advance});
            }, { 
                days_to_advance: days, 
            });
        } catch(e) {
            console.error(e);
            if (e.name === "SocketlibNoGMConnectedError") {
                console.log("Error: Can't run 'Expend Daily Food/Water' macro, no GM client available.");
                ui.notifications.error("Error: Can't run 'Expend Daily Food/Water' macro, no GM client available.");
            } else {
                console.log("Error: " + e.message);
                ui.notifications.error("Error: " + e.message);
            }
            return;
        }

        let new_day = SimpleCalendar.api.getCurrentDay().numericRepresentation;
        new_day = new_day == 1 ? ""+new_day+"st"
                    : new_day == 2 ? ""+new_day+"nd"
                    : new_day == 3 ? ""+new_day+"rd"
                    : ""+new_day+"th";
        let new_month = SimpleCalendar.api.getCurrentMonth().name;
        let new_year = SimpleCalendar.api.getCurrentYear().numericRepresentation;
        
        let chat_output_html = `
            <span>${old_day} of ${old_month}, ${old_year} &#8594; ${new_day} of ${new_month}, ${new_year}</span><br>
            ${insufficient_rations}
            ${insufficient_feed}
            ${insufficient_water}
            <span>Rations: ${old_rations_quantity} &#8594; ${rations_output}</span><br>
            <span>Feed: ${old_feed_quantity} &#8594; ${feed_output}</span><br>
            <span>Water: ${old_water_quantity} &#8594; ${water_output}</span>
        `;
        
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({actor: party_actor}),
            content: chat_output_html
        });
    },
});

custom_dialog.render(force = true, options = {width: 450});