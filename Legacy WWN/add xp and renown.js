const party_actor = game.actors.get('UjwAEFk2K9bC9nJu'); // Party actor id
const pc_actor_names = ['Rosaria Synn', 'Kazem Sahaba', 'Aldin Conger', 'Shelley', 'Siwa Chekov'];

new Dialog({
    title: `Apply XP and Renown`,
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
            callback: (html) => {
                const xp = Math.max(parseInt(html[0].querySelector('input#experience')?.value ?? 0), 0);
                const renown = Math.max(parseInt(html[0].querySelector('input#renown')?.value ?? 0), 0);
                apply_xp_and_renown(xp, renown).then((not_found) => {
                    if (not_found) {
                        ChatMessage.create({
                            user: game.user._id,
                            speaker: ChatMessage.getSpeaker({ actor: party_actor }),
                            content: `
                                <span>Players gain XP and Renown ${get_date()?.str ?? ''}</span><br>
                                <span>Each PC receives: <b>${xp} XP and ${renown} Renown</b></span><br>
                                ${not_found.reduce((acc, val) => {
                                    return acc + `<span>Couldn't find actor with ID '${val}'</span><br>`;
                                }, '')}
                                `,
                        });
                    }
                });
            },
        },
    },

    default: 'add',
}).render((force = true), (options = { width: 350 }));

// --------- helper functions --------

// xp and renown must be numbers >= 0
async function apply_xp_and_renown(xp, renown) {
    const actor_changes = {};
    pc_actor_names.forEach((name) => {
        const actor = game.actors.find((actor) => actor.name === name);
        if (actor)
            actor_changes[actor.id] = {
                'data.details.xp.value': actor.data.data.details.xp.value + xp,
                'data.details.renown.value': actor.data.data.details.renown.value + renown,
            };
    });

    try {
        return await Boneyard.Socketlib_Companion.executeAsGM(
            (args) => {
                const not_found = [];
                for (const actor_id in args.actor_changes) {
                    const actor = game.actors.get(actor_id);
                    if (actor) actor.update(args.actor_changes[actor_id]);
                    else not_found.push(actor_id);
                }
                return not_found;
            },
            {
                actor_changes: actor_changes,
            }
        );
    } catch (e) {
        const err_msg =
            e.name === 'SocketlibNoGMConnectedError'
                ? "Error: Can't run 'Apply XP and Renown' macro, no GM client available."
                : 'Error: ' + e.message;
        console.error(e);
        console.error(err_msg);
        return null;
    }
}

function get_date() {
    const day = SimpleCalendar?.api.getCurrentDay();
    const month = SimpleCalendar?.api.getCurrentMonth();
    const year = SimpleCalendar?.api.getCurrentYear();
    if (day && month && year) {
        const date = {
            day: {
                label: `${day.numericRepresentation}${
                    day.numericRepresentation === 1
                        ? 'st'
                        : day.numericRepresentation === 2
                        ? '2nd'
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
