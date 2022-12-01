const josh_actor = game.actors.find(actor => actor.data.name === "Edward Cyperian");

const alchemy_skill_item = josh_actor.data.items.find(i => i.data.type === "skill" && i.data.name.toLowerCase() === "alchemy");
const potion_crafting = josh_actor.data.data.attributes.potion_crafting;
const alchemy_formula = "@alchemy.skillDice + @alchemy.ownedLevel + @scores.int.mod";

const custom_dialog = new Dialog({
    title:`Potion Crafting Manager`,
    
    content: `
        <form>
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Potion name: </label>
                <input style="text-align:center; height: auto; min-width: 200px; flex-grow: 0;" id="potion_name" type="text" placeholder="Enter potion name" value="${potion_crafting.potion_name.value}" />
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px; padding-right: 10px;">Craft DC: </label>
                <input style="text-align:center; height: auto; min-width: 40px; flex-grow: 0;" id="craft_dc" type="number" step="1" min="0" value="${potion_crafting.craft_dc.value}" />
                
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px; padding-right: 10px;">Batch: </label>
                <select style="text-align:center; height: auto; min-width: 40px; flex-grow: 0;" id="batch_size">
                    <option value="1" ${potion_crafting.batch_size.value === 1 ? selected="selected" : ``}>1</option>
                    <option value="2" ${potion_crafting.batch_size.value === 2 ? selected="selected" : ``}>2</option>
                    <option value="4" ${potion_crafting.batch_size.value === 4 ? selected="selected" : ``}>4</option>
                </select>
                
                <div></div>
            </div>
            
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Days remaining: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="days_remaining" type="number" step="1" min="0" value="${potion_crafting.days_remaining.value}" />
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Modifier: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="modifier" type="number" step="1" value="${potion_crafting.modifier.value}" />
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 5px;">Rushed? </label>
                <input type="checkbox" id="rushed" ${potion_crafting.rushed.value ? `checked` : ``}>
                <div></div>
            </div>
            <hr>
            
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Days to progress: </label>
                <button style="flex-grow: 0; line-height: normal; min-width: 40px;" id="days_minus_button" title="Click to subtract 1. Shift-click to subtract 7.">-</button>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="days_to_progress" type="number" step="1" value="0" />
                <button style="flex-grow: 0; line-height: normal; min-width: 40px;" id="days_add_button" title="Click to add 1. Shift-click to add 7.">+</button>
                <div></div>
            </div>

            <div class="form-group" style="flex-direction: row; padding-top: 10px;">
                <button style="flex-grow: 1; line-height: normal; min-height: 30px;" id="clear_button" title="Click to reset all potion crafting fields.">Clear All Fields</button>
                <button style="flex-grow: 1; line-height: normal; min-height: 30px;" id="progress_button" title="Click to progress the declared amount of days.">Progress</button>
            </div>
            <hr>
        </form>
    `,
    
    buttons: {
        close: {
            label: `Close`
        },
    },
    
    default: "close",
    
    render: (html) => {

        // Focus the days input field
        // For whatever reason doing this without a timeout during the render step doesn't work.
        // My guess is that the browser hasn't finished processing/updating the DOM (document object model)
        // to render, and so the focus call fails. By putting it in a timeout, the browser finishes all 
        // the work it needs to do and only after that sets the focus on my desired element.
        setTimeout(() => {
            document.getElementById("days_to_progress").focus({focusVisible: true});
        }, 0);
        
        // Hook anonymous functions onto button clicks
        document.getElementById("days_minus_button").addEventListener("click", (e) => {
            document.getElementById("days_to_progress").value = parseInt(document.getElementById("days_to_progress").value) - (e.shiftKey ? 7 : 1);
        });
        document.getElementById("days_add_button").addEventListener("click", (e) => {
            document.getElementById("days_to_progress").value = parseInt(document.getElementById("days_to_progress").value) + (e.shiftKey ? 7 : 1);
        });
        document.getElementById("clear_button").addEventListener("click", (e) => {
            clear_fields();
        });
        document.getElementById("progress_button").addEventListener("click", (e) => {
            const progressed_days = parseInt(document.getElementById("days_to_progress").value);
            const days_left = parseInt(document.getElementById("days_remaining").value) - progressed_days;
            if (days_left > 0) {
                document.getElementById("days_to_progress").value = 0;
                document.getElementById("days_remaining").value = days_left;
            } else {
                
                let chat_output_html;
                if (!document.getElementById("rushed").checked) {
                    chat_output_html = `<span>${josh_actor.name} <b style="color:green;">successfully crafts</b> ${document.getElementById("batch_size").value} ${document.getElementById("potion_name").value}.</span><br>`;
                
                    ChatMessage.create({
                        user: game.user._id,
                        speaker: ChatMessage.getSpeaker({actor: josh_actor}),
                        content: chat_output_html
                    });
                    clear_fields();
                    
                } else {
                    const batch_size = parseInt(document.getElementById("batch_size").value);
                    const batch_modifier = batch_size === 1 ? 0 : batch_size === 2 ? 1 : 2;
                    const adjusted_dc = parseInt(document.getElementById("craft_dc").value) + batch_modifier;
                    
                    let roll_data = josh_actor.getRollData();
                    roll_data.alchemy = alchemy_skill_item.data.data;
                    new Roll(alchemy_formula + "+" + document.getElementById("modifier").value, roll_data).roll({async: true}).then(alchemy_check => {
                        const passed = alchemy_check.total >= adjusted_dc;
                        alchemy_check.render().then(alchemy_render => {
                            chat_output_html = `<span>${josh_actor.name} ${passed
                                    ? `<b style="color:green;">successfully crafts</b> a rushed batch of `
                                    : `<b style="color:red;">fails to craft</b> a rushed batch of `}
                                ${batch_size} ${document.getElementById("potion_name").value}.</span><br>
                                Alchemy skill check (DC ${adjusted_dc}): </br> ${alchemy_render}
                                `;
                            
                            ChatMessage.create({
                                user: game.user._id,
                                speaker: ChatMessage.getSpeaker({actor: josh_actor}),
                                content: chat_output_html
                            });
                            clear_fields();
                        });
                    });
                }
            }
        });
    }, 
    
    close: async (html) => {
        josh_actor.update({
            "data.attributes.potion_crafting.potion_name.value": document.getElementById("potion_name").value,
            "data.attributes.potion_crafting.craft_dc.value": parseInt(document.getElementById("craft_dc").value),
            "data.attributes.potion_crafting.days_remaining.value": parseInt(document.getElementById("days_remaining").value),
            "data.attributes.potion_crafting.rushed.value": document.getElementById("rushed").checked,
            "data.attributes.potion_crafting.modifier.value": parseInt(document.getElementById("modifier").value),
            "data.attributes.potion_crafting.batch_size.value": parseInt(document.getElementById("batch_size").value),
        });
    },
});

const clear_fields = () => {
    document.getElementById("potion_name").value = "";
    document.getElementById("craft_dc").value = 0;
    document.getElementById("days_remaining").value = 0;
    document.getElementById("modifier").value = 0;
    document.getElementById("rushed").checked = false;
    document.getElementById("days_to_progress").value = 0;
    document.getElementById("batch_size").value = 1;
};

custom_dialog.render(force = true, options = {width: 525});