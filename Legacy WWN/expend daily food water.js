const HOT_CLIMATE_WATER_MULT = 2;
const SMALL_ANIMAL_FEED = 2;
const SMALL_ANIMAL_WATER = 4;
const LARGE_ANIMAL_FEED = 4;
const LARGE_ANIMAL_WATER = 8;

const party_actor = game.actors.get('UjwAEFk2K9bC9nJu');
if (!party_actor) return console.error(`Could not find party actor.`);

const items = {
    rations: party_actor.data.items.find((item) => item.data.name === 'Rations'),
    feed: party_actor.data.items.find((item) => item.data.name === 'Animal Feed'),
    water: party_actor.data.items.find((item) => item.data.name === 'Water'),
};

const data = {
    party: party_actor.data.data.attributes,
    rations: items.rations.data.data,
    feed: items.feed.data.data,
    water: items.water.data.data,
};

const supplies = {
    rations: {
        total: data.rations.quantity,
        daily: data.party.party_size.value,
        left: undefined,
    },
    feed: {
        total: data.feed.quantity,
        daily:
            data.party.small_pack_animals.value * SMALL_ANIMAL_FEED +
            data.party.small_pack_animals.value * LARGE_ANIMAL_FEED,
        left: undefined,
    },
    water: {
        total: data.water.quantity,
        daily:
            data.party.party_size.value +
            data.party.small_pack_animals.value * SMALL_ANIMAL_WATER +
            data.party.small_pack_animals.value * LARGE_ANIMAL_WATER,
        left: undefined,
    },
    hot_water: {
        daily: undefined,
        left: undefined,
    },
};
supplies.rations.left = Math.floor(supplies.rations.total / supplies.rations.daily);
supplies.feed.left = Math.floor(supplies.feed.total / supplies.feed.daily);
supplies.water.left = Math.floor(supplies.water.total / supplies.water.daily);
supplies.hot_water.daily = supplies.water.daily * HOT_CLIMATE_WATER_MULT;
supplies.hot_water.left = Math.floor(supplies.water.total / supplies.hot_water.daily);

new Dialog({
    title: `Expend Daily Food/Water`,

    content: `
        <form>
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;"><b>Total Supplies:</b></label>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;"><b>Rations - ${supplies.rations.total}</b></label>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;"><b>Animal feed - ${supplies.feed.total}</b></label>
                <label style="white-space: nowrap; flex-grow: 0;"><b>Water - ${supplies.water.total}</b></label>
                <div></div>
            </div>
            <hr>

            <div style="display: grid; grid-template-columns: 4fr 3fr 3fr 2fr; grid-template-rows: repeat(5, 1fr); grid-row-gap: 2px;">
                
                <label style="grid-column: 2; grid-row: 1; text-align: center;"><b>Used Daily</b></label>
                <label style="grid-column: 3; grid-row: 1; text-align: center;"><b>Remaining Days</b></label>

                <label style="grid-column: 1; grid-row: 2; text-align: right;">Rations:</label>
                <label style="grid-column: 2; grid-row: 2; text-align: center;">${supplies.rations.daily}</label>
                <label style="grid-column: 3; grid-row: 2; text-align: center;">${supplies.rations.left}</label>

                <label style="grid-column: 1; grid-row: 3; text-align: right;">Feed:</label>
                <label style="grid-column: 2; grid-row: 3; text-align: center;">${supplies.feed.daily}</label>
                <label style="grid-column: 3; grid-row: 3; text-align: center;">${supplies.feed.left}</label>

                <label style="grid-column: 1; grid-row: 4; text-align: right;">Water:</label>
                <label style="grid-column: 2; grid-row: 4; text-align: center;">${supplies.water.daily}</label>
                <label style="grid-column: 3; grid-row: 4; text-align: center;">${supplies.water.left}</label>

                <label style="grid-column: 1; grid-row: 5; text-align: right;">(Hot Climate) Water:</label>
                <label style="grid-column: 2; grid-row: 5; text-align: center;">${supplies.hot_water.daily}</label>
                <label style="grid-column: 3; grid-row: 5; text-align: center;">${supplies.hot_water.left}</label>

            </div>
            <hr>
            
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Days: </label>
                <button class="days-button" style="flex-grow: 0; line-height: normal; min-width: 30px;" data-action="-" title="Click to subtract 1. Shift-click to subtract 7.">-</button>
                <input style="text-align:center; height: auto; min-width: 80px; flex-grow: 0;" id="days" type="number" step="1" min="0" value="0" />
                <button class="days-button" style="flex-grow: 0; line-height: normal; min-width: 30px;" data-action="+" title="Click to add 1. Shift-click to add 7.">+</button>
                <div></div>
            </div>
            <hr>
        </form>
    `,

    buttons: {
        nothing: {
            label: `No Supplies`,
            callback: (html) => expend_supplies(calculate_needed_supplies(html, 0, 0, 0)),
        },
        water_none: {
            label: `No Water`,
            callback: (html) => expend_supplies(calculate_needed_supplies(html, 1, 1, 0)),
        },
        water_standard: {
            label: `Standard Water`,
            callback: (html) => expend_supplies(calculate_needed_supplies(html, 1, 1, 1)),
        },
        water_hot: {
            label: `Hot Climate Water`,
            callback: (html) => expend_supplies(calculate_needed_supplies(html, 1, 1, HOT_CLIMATE_WATER_MULT)),
        },
    },

    default: 'water_none',

    render: (html) => {
        html[0].querySelectorAll('button.days-button').forEach((button) =>
            button.addEventListener('click', (event) => {
                const days = event.target.closest('div')?.querySelector('input#days');
                if (days)
                    days.value = Math.max(
                        0,
                        parseInt(days.value) +
                            (event.target.dataset.action === '+' ? +1 : -1) * (event.shiftKey ? 7 : 1)
                    );
            })
        );
    },
}).render((force = true), (options = { width: 550 }));

// --------- helper functions --------

async function expend_supplies(supplies_used) {
    let updates_str = '';
    const changes = {};

    for (const supply_type in supplies_used) {
        if (supplies[supply_type]) {
            const label = supply_type.charAt(0).toUpperCase() + supply_type.slice(1);
            const new_total = supplies[supply_type].total - supplies_used[supply_type];
            const days_left = Math.floor(new_total / supplies[supply_type].daily);
            changes[supply_type] = Math.max(0, new_total);
            updates_str = `${updates_str}
                ${new_total < 0 ? `<span>!!! Short ${-new_total} ${supply_type} !!!</span><br>` : ''}
                <span>${label}: ${days_left < 0 ? `<b style="color:#FF0000;">0</b>` : days_left} days left
                </span><br>`;
        }
    }

    const old_date = get_date();
    let dateChangeData = null;
    console.log(supplies_used);
    try {
        dateChanged = await Boneyard.Socketlib_Companion.executeAsGM(
            (args) => {
                let success = SimpleCalendar.api.changeDate({ day: args.days_to_advance });
                if (success) {
                    return {
                        day: SimpleCalendar.api.getCurrentDay(),
                        month: SimpleCalendar.api.getCurrentMonth(),
                        year: SimpleCalendar.api.getCurrentYear(),
                    };
                } else return null;
            },
            { days_to_advance: supplies_used.days }
        );
    } catch (e) {
        const err_msg =
            e.name === 'SocketlibNoGMConnectedError'
                ? "Error: Can't run 'Expend Daily Food/Water' macro, no GM client available."
                : 'Error: ' + e.message;
        console.error(e);
        console.error(err_msg);
        ui.notifications.error(err_msg);
        return;
    }
    console.log(dateChanged);
    const new_date = get_date(dateChanged?.day, dateChanged?.month, dateChanged?.year);
    for (const supply_type in changes) items[supply_type].update({ 'data.quantity': changes[supply_type] });

    ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: party_actor }),
        content: `<span>${old_date.str} &#8594; ${new_date.str}</span><br>${updates_str}`,
    });
}

function calculate_needed_supplies(html, ration_mult, feed_mult, water_mult) {
    const days = parseInt(html[0].querySelector('input#days').value);
    return {
        days: days,
        rations: supplies.rations.daily * ration_mult * days,
        feed: supplies.feed.daily * feed_mult * days,
        water: supplies.water.daily * water_mult * days,
    };
}

function get_date(day, month, year) {
    day ??= SimpleCalendar?.api.getCurrentDay();
    month ??= SimpleCalendar?.api.getCurrentMonth();
    year ??= SimpleCalendar?.api.getCurrentYear();
    if (day && month && year) {
        const date = {
            day: {
                label: `${day.numericRepresentation}${
                    day.numericRepresentation === 1
                        ? 'st'
                        : day.numericRepresentation === 2
                        ? 'nd'
                        : day.numericRepresentation === 3
                        ? 'rd'
                        : 'th'
                }`,
                value: day.numericRepresentation,
            },
            month: {
                label: month.name,
                value: month.numericRepresentation,
            },
            year: year.numericRepresentation,
            str: undefined,
        };
        date.str = `${date.day.label} of ${date.month.label}, ${date.year}`;
        return date;
    } else return null;
}