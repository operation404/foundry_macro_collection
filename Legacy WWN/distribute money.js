const party_actor = game.actors.get('UjwAEFk2K9bC9nJu'); // Party actor id
const players = ['Rosaria Synn', 'Kazem Sahaba', 'Aldin Conger', 'Shelley', 'Siwa Chekov'].map((char_name) =>
    game.actors.find((actor) => actor.name === char_name)
);

new Dialog({
    title: `Distribute Money`,

    content: `
        <form>
            <div class="form-group" style="flex-direction: row;">
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Party fund: <b>
                    ${party_actor.data.data.currency.total - party_actor.data.data.treasure}
                    </b> (
                        ${party_actor.data.data.currency.cp}cp 
                        ${party_actor.data.data.currency.sp}sp 
                        ${party_actor.data.data.currency.gp}gp
                    )</label>
                <div></div>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 10px;">Party fund ratio: </label>
                <input style="text-align:center; height: auto; min-width: 40px; flex-grow: 0;" id="party_fund_ratio" type="number" step="0.01" value="0.5" min="0" max="1" />
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
        shares: {
            label: `Shares`,
            callback: (html) => {
                let party_fund_ratio = parseFloat(html[0].querySelector('input#party_fund_ratio').value);
                party_fund_ratio = isNaN(party_fund_ratio) ? 0 : party_fund_ratio;
                const coins = {
                    'data.currency.cp': parseInt(html[0].querySelector('input#copper').value),
                    'data.currency.sp': parseInt(html[0].querySelector('input#silver').value),
                    'data.currency.gp': parseInt(html[0].querySelector('input#gold').value),
                };
                for (const coin in coins) if (isNaN(coins[coin])) coins[coin] = 0;
                calculate_player_money('shares', party_fund_ratio, coins);
            },
        },
        exact: {
            label: `Exact`,
            callback: (html) => {
                const coins = {
                    'data.currency.cp': parseInt(html[0].querySelector('input#copper').value),
                    'data.currency.sp': parseInt(html[0].querySelector('input#silver').value),
                    'data.currency.gp': parseInt(html[0].querySelector('input#gold').value),
                };
                for (const coin in coins) if (isNaN(coins[coin])) coins[coin] = 0;
                calculate_player_money('exact', 0, coins);
            },
        },
    },
    default: 'shares',
}).render((force = true), (options = { width: 500 }));

// --------- helper functions --------

function calculate_player_money(method, party_fund_ratio, coins) {
    party_fund_ratio = Math.clamped(party_fund_ratio, 0, 1);
    const party_changes = {
        'data.currency.cp': party_actor.data.data.currency.cp ?? 0,
        'data.currency.sp': party_actor.data.data.currency.sp ?? 0,
        'data.currency.gp': party_actor.data.data.currency.gp ?? 0,
    };
    const changes = {};
    players.forEach(
        (player) =>
            (changes[player.id] = {
                'data.currency.cp': player.data.data.currency.cp ?? 0,
                'data.currency.sp': player.data.data.currency.sp ?? 0,
                'data.currency.gp': player.data.data.currency.gp ?? 0,
            })
    );
    // Log these for safety
    console.log('party', JSON.stringify(party_changes));
    console.log('players', JSON.stringify(changes));

    Object.entries(coins).forEach(
        method === 'shares'
            ? ([coin, amount]) => {
                  const fund_share = Math.floor(amount * party_fund_ratio);
                  amount -= fund_share;
                  const player_share = Math.floor(amount / players.length);
                  amount -= player_share * players.length;
                  party_changes[coin] += fund_share + amount;
                  for (const player in changes) changes[player][coin] += player_share;
              }
            : ([coin, amount]) => {
                  for (const player in changes) changes[player][coin] += amount;
              }
    );
    changes[party_actor.id] = party_changes;

    try {
        Boneyard.Socketlib_Companion.executeAsGM(
            (args) => {
                Object.entries(args.changes).forEach(([actor_id, new_money]) =>
                    game.actors.get(actor_id)?.update(new_money)
                );
            },
            { changes: changes }
        );
    } catch (e) {
        const err_msg =
            e.name === 'SocketlibNoGMConnectedError'
                ? "Error: Can't run 'Distribute Money' macro, no GM client available."
                : 'Error: ' + e.message;
        console.error(e);
        console.error(err_msg);
        return ui.notifications.error(err_msg);
    }

    const amount_str = `<span>Amount: 
        ${coins['data.currency.gp'] > 0 ? `${coins['data.currency.gp']}gp` : ''} 
        ${coins['data.currency.sp'] > 0 ? `${coins['data.currency.sp']}sp` : ''}
        ${coins['data.currency.cp'] > 0 ? `${coins['data.currency.cp']}cp` : ''}
        </span><br>`;

    const shares_str =
        method === 'exact'
            ? '<span>All players receive that exact amount.</span><br>'
            : `<span>
        ${
            party_changes['data.currency.gp'] == 0 &&
            party_changes['data.currency.sp'] == 0 &&
            party_changes['data.currency.cp'] == 0
                ? 'Party fund receives no money.'
                : 'Party fund gets: '
        } 
        ${party_changes['data.currency.gp'] > 0 ? `${party_changes['data.currency.gp']}gp` : ''} 
        ${party_changes['data.currency.sp'] > 0 ? `${party_changes['data.currency.sp']}sp` : ''}
        ${party_changes['data.currency.cp'] > 0 ? `${party_changes['data.currency.cp']}cp` : ''}
        </span><br>
        <span>
        ${
            changes[players[0].id]['data.currency.gp'] == 0 &&
            changes[players[0].id]['data.currency.sp'] == 0 &&
            changes[players[0].id]['data.currency.cp'] == 0
                ? 'Players receive no money.'
                : 'Players get: '
        }
        ${changes[players[0].id]['data.currency.gp'] > 0 ? `${changes[players[0].id]['data.currency.gp']}gp` : ''} 
        ${changes[players[0].id]['data.currency.sp'] > 0 ? `${changes[players[0].id]['data.currency.sp']}sp` : ''}
        ${changes[players[0].id]['data.currency.cp'] > 0 ? `${changes[players[0].id]['data.currency.cp']}cp` : ''}
        </span><br>`;

    ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: party_actor }),
        content: `<span>Money distribution ${get_date().str}</span><br>${amount_str}${shares_str}`,
    });
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
