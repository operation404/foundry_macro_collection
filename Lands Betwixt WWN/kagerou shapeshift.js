const kagerou = canvas.scene.tokens.find(a => a.name === "Kagerou");
const cookie = canvas.scene.tokens.find(a => a.name === "Cookie");

const custom_dialog = new Dialog({
    title: `Token Lighting Controls`,

    content: `
            <form>
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 5px;">Kagerou forms </label>
                <div class="form-group" style="flex-direction: row;">
                    <button style="flex-grow: 0; min-width: max-content; white-space: nowrap;" id="kagerou_base_form">Base Form</button>
                    <button style="flex-grow: 0; min-width: max-content; white-space: nowrap;" id="kagerou_wolf_form">Wolf Form</button>
                </div>
                <hr>
                
                <label style="white-space: nowrap; flex-grow: 0; padding-right: 5px;">Cookie forms </label>
                <div class="form-group" style="flex-direction: row;">
                    <button style="flex-grow: 0; min-width: max-content; white-space: nowrap;" id="cookie_small_form">Small Form</button>
                    <button style="flex-grow: 0; min-width: max-content; white-space: nowrap;" id="cookie_big_form">Big Form</button>
                </div>
                <hr>
            </form>
  `,

    buttons: {
        close: {
            label: `Close`,
            callback: () => {}
        },
    },
    default: "close",

    render: (html) => {

        // Kagerou buttons
        document.getElementById("kagerou_base_form").addEventListener("click", (e) => {
            update_kagerou("images/player%20tokens/Kagerou.png", 1);
        });
        document.getElementById("kagerou_wolf_form").addEventListener("click", (e) => {
            update_kagerou("images/player%20tokens/Kagerouwolftoken.png", 2);
        });

        // Cookie buttons
        document.getElementById("cookie_small_form").addEventListener("click", (e) => {
            update_cookie("images/player%20tokens/Cookie%20token.png", 1);
        });
        document.getElementById("cookie_big_form").addEventListener("click", (e) => {
            update_cookie("images/player%20tokens/Cookie%20Token%20Big.png", 2);
        });
    },

    close: () => {}
});

function update_kagerou(img, size) {
    if (kagerou === undefined) {
        ui.notifications.warning("No Kagerou token found on this scene!");
        return;
    }
    console.log(kagerou);
    kagerou.update({
        img: img,
        width: size,
        height: size,
    });
}

function update_cookie(img, size) {
    if (cookie === undefined) {
        ui.notifications.warning("No Cookie token found on this scene!");
        return;
    }
    cookie.update({
        img: img,
        width: size,
        height: size,
    });
}



custom_dialog.render(force = true, options = {
    width: 300
});