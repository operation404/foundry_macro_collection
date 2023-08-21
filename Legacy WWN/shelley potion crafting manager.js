const nick_actor = game.actors.find((actor) => actor.data.name === 'Shelley');

const alchemy_skill_item = nick_actor.data.items.find(
    (i) => i.data.type === 'skill' && i.data.name.toLowerCase() === 'alchemy'
);
const potion_crafting = nick_actor.data.data.attributes.potion_crafting;
const alchemy_formula = '@alchemy.skillDice + @alchemy.ownedLevel + @scores.dex.mod';

const potion_presets = {
    // Core book magic elixirs
    'Anchoring Draught': { dc: 9, cost: 500, time: 7 },
    'Bestial Form': { dc: 10, cost: 1250, time: 7 },
    'Blood of Boiling Rage': { dc: 8, cost: 250, time: 7 },
    'Bodily Innervation': { dc: 11, cost: 2500, time: 7 },
    'Borrowed Flesh': { dc: 8, cost: 500, time: 7 },
    'Cold Courage': { dc: 9, cost: 1000, time: 7 },
    'Congealed Winter': { dc: 9, cost: 1250, time: 7 },
    'Deep Sight': { dc: 10, cost: 1250, time: 7 },
    'Energetic Impermeability': { dc: 9, cost: 500, time: 7 },
    'Inverted Entropy': { dc: 10, cost: 1250, time: 7 },
    'Murderous Anointing': { dc: 9, cost: 500, time: 7 },
    'Nectar of Immortality': { dc: 12, cost: 50000, time: 30 },
    'Nepenthe': { dc: 11, cost: 12500, time: 30 },
    'Omened Visions': { dc: 8, cost: 375, time: 7 },
    'Persistent Luminescence': { dc: 8, cost: 250, time: 7 },
    'Plasmic Molding': { dc: 9, cost: 500, time: 7 },
    'Quintessence of the Hour': { dc: 10, cost: 2500, time: 7 },
    'Sacrificial Strength': { dc: 9, cost: 500, time: 7 },
    'Sanctified Healing': { dc: 8, cost: 250, time: 7 },
    'Scalding Breath': { dc: 9, cost: 500, time: 7 },
    'Soul Sight': { dc: 8, cost: 250, time: 7 },
    'Thaumic Vitality': { dc: 11, cost: 2500, time: 7 },
    'The Great and the Small': { dc: 10, cost: 500, time: 7 },
    'Truthspeaking': { dc: 10, cost: 1250, time: 7 },
    'Wrathful Detonation': { dc: 9, cost: 250, time: 7 },

    // Atlas of latter earth lesser works
    'Acid Vial (LW)': { dc: 10, cost: 50, time: 1 },
    'Binding Paste (LW)': { dc: 9, cost: 50, time: 1 },
    'Blinding Dust (LW)': { dc: 9, cost: 50, time: 2 },
    'Healing Salve (LW)': { dc: 7, cost: 10, time: 1 },
    'Incandescent Dust (LW)': { dc: 9, cost: 500, time: 1 },
    'Inflammable Oil (LW)': { dc: 8, cost: 100, time: 1 },
    'Itching Dust (LW)': { dc: 9, cost: 100, time: 2 },
    'Luminescent Oil (LW)': { dc: 8, cost: 50, time: 1 },
    'Self-Igniting Oil (LW)': { dc: 8, cost: 50, time: 3 },
    'Smoke Cloud (LW)': { dc: 9, cost: 25, time: 2 },
    'Soothing Powder (LW)': { dc: 8, cost: 25, time: 2 },
    'Touchstone (LW)': { dc: 10, cost: 50, time: 3 },

    // Atlas of latter earth greater works
    'Aqueous Solvent (GW)': { dc: 11, cost: 250, time: 5 },
    'Courage Elixir (GW)': { dc: 10, cost: 200, time: 7 },
    'Infernal Wind (GW)': { dc: 11, cost: 250, time: 7 },
    'Lethal Poison (GW)': { dc: 11, cost: 500, time: 7 },
    'Revivifying Draught (GW)': { dc: 10, cost: 200, time: 7 },
    'Sleeping Powders (GW)': { dc: 10, cost: 200, time: 3 },
    'Sovereign Specific (GW)': { dc: 11, cost: 200, time: 7 },
    'Unquenchable Flame (GW)': { dc: 12, cost: 1000, time: 14 },
};

const potion_presets_list_items_template = `
        {{#each this}}
            <option value="{{@key}}">{{@key}}</option>
        {{/each}}
    `;
const rendered_template = Handlebars.compile(potion_presets_list_items_template)(potion_presets);

const custom_dialog = new Dialog({
    title: `Potion Crafting Manager`,

    content: `
        <form>
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0;padding-right: 10px;">Select preset (clears fields!): </label>
                <select style="text-align:left; height: auto; min-width: 190px; flex-grow: 0;" id="potion_presets">
                    <option disabled selected value> -- select an option -- </option>
                    ${rendered_template}
                </select>
                <div></div>
            </div>
            <hr>
            
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Potion name: </label>
                <input style="text-align:center; height: auto; min-width: 200px; flex-grow: 0;" id="potion_name" type="text" placeholder="Enter potion name" value="${
                    potion_crafting.potion_name.value
                }" />
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px; padding-right: 10px;">Craft DC: </label>
                <input style="text-align:center; height: auto; min-width: 40px; flex-grow: 0;" id="craft_dc" type="number" step="1" min="0" value="${
                    potion_crafting.craft_dc.value
                }" />
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px; padding-right: 10px;">SP Cost: </label>
                <input style="text-align:center; height: auto; min-width: 50px; flex-grow: 0;" id="cost" type="number" step="1" min="0" value="${
                    potion_crafting.cost.value
                }" />
                <div></div>
            </div>
            
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Days remaining: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="days_remaining" type="number" step="1" min="0" value="${
                    potion_crafting.days_remaining.value
                }" />
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Modifier: </label>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="modifier" type="number" step="1" value="${
                    potion_crafting.modifier.value
                }" />
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-left: 10px; padding-right: 10px;">Batch: </label>
                <select style="text-align:center; height: auto; min-width: 40px; flex-grow: 0;" id="batch_size">
                    <option value="1" ${
                        potion_crafting.batch_size.value === 1 ? (selected = 'selected') : ``
                    }>1</option>
                    <option value="2" ${
                        potion_crafting.batch_size.value === 2 ? (selected = 'selected') : ``
                    }>2</option>
                    <option value="4" ${
                        potion_crafting.batch_size.value === 4 ? (selected = 'selected') : ``
                    }>4</option>
                </select>
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
            label: `Close`,
        },
    },

    default: 'close',

    render: (html) => {
        // Focus the days input field
        // For whatever reason doing this without a timeout during the render step doesn't work.
        // My guess is that the browser hasn't finished processing/updating the DOM (document object model)
        // to render, and so the focus call fails. By putting it in a timeout, the browser finishes all
        // the work it needs to do and only after that sets the focus on my desired element.
        setTimeout(() => {
            document.getElementById('days_to_progress').focus({ focusVisible: true });
        }, 0);

        // Hook anonymous functions onto button clicks
        document.getElementById('days_minus_button').addEventListener('click', (e) => {
            document.getElementById('days_to_progress').value =
                parseInt(document.getElementById('days_to_progress').value) - (e.shiftKey ? 7 : 1);
        });
        document.getElementById('days_add_button').addEventListener('click', (e) => {
            document.getElementById('days_to_progress').value =
                parseInt(document.getElementById('days_to_progress').value) + (e.shiftKey ? 7 : 1);
        });
        document.getElementById('clear_button').addEventListener('click', (e) => {
            clear_fields();
        });
        document.getElementById('progress_button').addEventListener('click', (e) => {
            const progressed_days = parseInt(document.getElementById('days_to_progress').value);
            const days_left = parseInt(document.getElementById('days_remaining').value) - progressed_days;
            if (days_left > 0) {
                document.getElementById('days_to_progress').value = 0;
                document.getElementById('days_remaining').value = days_left;
            } else {
                let chat_output_html;
                const batch_size = parseInt(document.getElementById('batch_size').value);
                const batch_modifier = batch_size === 1 ? 0 : batch_size === 2 ? 1 : 2;
                const adjusted_dc = parseInt(document.getElementById('craft_dc').value) + batch_modifier;

                let roll_data = nick_actor.getRollData();
                roll_data.alchemy = alchemy_skill_item.data.data;
                new Roll(alchemy_formula + '+' + document.getElementById('modifier').value, roll_data)
                    .roll({ async: true })
                    .then((alchemy_check) => {
                        const passed = alchemy_check.total >= adjusted_dc;
                        alchemy_check.render().then((alchemy_render) => {
                            chat_output_html = `<span>${nick_actor.name} ${
                                passed
                                    ? `<b style="color:green;">successfully crafts</b> a batch of `
                                    : `<b style="color:red;">fails to craft</b> a batch of `
                            }
                            ${batch_size} ${document.getElementById('potion_name').value}.</span><br>
                            Alchemy skill check (DC ${adjusted_dc}): </br> ${alchemy_render}
                            `;

                            ChatMessage.create({
                                user: game.user._id,
                                speaker: ChatMessage.getSpeaker({ actor: nick_actor }),
                                content: chat_output_html,
                            });
                            clear_fields();
                        });
                    });
            }
        });
        document.getElementById('potion_presets').addEventListener('change', (e) => {
            clear_fields();
            const selected_potion = potion_presets[document.getElementById('potion_presets').value];
            document.getElementById('potion_name').value = document.getElementById('potion_presets').value;
            document.getElementById('craft_dc').value = selected_potion.dc;
            document.getElementById('cost').value = selected_potion.cost;
            document.getElementById('days_remaining').value = selected_potion.time;
        });
    },

    close: async (html) => {
        nick_actor.update({
            'data.attributes.potion_crafting.potion_name.value': document.getElementById('potion_name').value,
            'data.attributes.potion_crafting.craft_dc.value': parseInt(document.getElementById('craft_dc').value),
            'data.attributes.potion_crafting.cost.value': parseInt(document.getElementById('cost').value),
            'data.attributes.potion_crafting.days_remaining.value': parseInt(
                document.getElementById('days_remaining').value
            ),
            'data.attributes.potion_crafting.modifier.value': parseInt(document.getElementById('modifier').value),
            'data.attributes.potion_crafting.batch_size.value': parseInt(document.getElementById('batch_size').value),
        });
    },
});

const clear_fields = () => {
    document.getElementById('potion_name').value = '';
    document.getElementById('craft_dc').value = 0;
    document.getElementById('days_remaining').value = 0;
    document.getElementById('modifier').value = 0;
    document.getElementById('days_to_progress').value = 0;
    document.getElementById('batch_size').value = 1;
};

custom_dialog.render((force = true), (options = { width: 550 }));
