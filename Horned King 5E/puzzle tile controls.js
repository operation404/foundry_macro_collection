const debug = true;
const scene = game.scenes.get("So4wk13Mw15azBM7");
scene.puzzle_lasers = scene.puzzle_lasers ?? [];
let temp_laser_data = [];

const laser_light_data = {
    config: {
        dim: 105,
        bright: 105,
        angle: 2,
        coloration: 1,
        color: "#ffa200",
        alpha: 1,
        luminosity: 0.4,
        animation: {
            type: "grid",
            intensity: 5,
            speed: 6,
            reverse: false,
        },
        attenuation: 0,
    }
};
const barrier_objs = {
    tile_id: "zI7yDuno62DT7K5a",
    light_ids: ["p3tftDzFgBg0g4Vk", "fFqqJF8QsxIxVBu0", "78yJnzu48LfPzduR"]
};
const lights = {
    "A": scene.lights.get("vikO16LQamPE1uvv"),
    "B": scene.lights.get("juqoyby7OrdlklFv"),
    "C": scene.lights.get("vFktowkAbVamBCof"),
    "D": scene.lights.get("sv8bC2aSAtr7eqhQ"),
    "E": scene.lights.get("16QYZmcAWmwuxOSG"),
    "F": scene.lights.get("4zUV9FatkpulA22h"),
};
const tile_ids = {
    "1": "Y2x3wgFiKmavPOqz",
    "2": "yK9bdXa1kFahVRzY",
    "3": "zqEgXRO0WEXZH907",
    "4": "Zan7EGxcikP2CtbD",
    "5": "0U7HJicYnF8shuPg",
    "6": "u4hMSGprWRwmoctq",
    "7": "Ps1LmOqUKUMtqRd4",
    "8": "VtryHPOoz3f7Gwgt",
    "9": "BsXGPeiG9O0Cuanu",
};
const tiles = {
    "1": scene.tiles.get(tile_ids[1]),
    "2": scene.tiles.get(tile_ids[2]),
    "3": scene.tiles.get(tile_ids[3]),
    "4": scene.tiles.get(tile_ids[4]),
    "5": scene.tiles.get(tile_ids[5]),
    "6": scene.tiles.get(tile_ids[6]),
    "7": scene.tiles.get(tile_ids[7]),
    "8": scene.tiles.get(tile_ids[8]),
    "9": scene.tiles.get(tile_ids[9]),
};
const paths = {
    [tile_ids[1]]: {"type": "angled", "up": undefined, "right": tiles[2], "down": tiles[4], "left": undefined},
    [tile_ids[2]]: {"type": "angled", "up": undefined, "right": tiles[3], "down": tiles[5], "left": tiles[1]},
    [tile_ids[3]]: {"type": "angled", "up": undefined, "right": undefined, "down": tiles[6], "left": tiles[2]},
    [tile_ids[4]]: {"type": "angled", "up": tiles[1], "right": tiles[5], "down": tiles[7], "left": undefined},
    [tile_ids[5]]: {"type": "angled", "up": tiles[2], "right": tiles[6], "down": tiles[8], "left": tiles[4]},
    [tile_ids[6]]: {"type": "angled", "up": tiles[3], "right": undefined, "down": tiles[9], "left": tiles[5]},
    [tile_ids[7]]: {"type": "angled", "up": tiles[4], "right": tiles[8], "down": undefined, "left": undefined},
    [tile_ids[8]]: {"type": "straight","up": tiles[5], "right": tiles[9], "down": undefined, "left": tiles[7]},
    [tile_ids[9]]: {"type": "angled", "up": tiles[6], "right": undefined, "down": undefined, "left": tiles[8]},
};
const direction_combinations = {
  "angled": {
      "0": ["up", "left"],
      "90": ["up", "right"],
      "180": ["right", "down"],
      "270": ["down", "left"],
  },
  "straight": {
      "0": ["up", "down"],
      "90": ["right", "left"],
      "180": ["up", "down"],
      "270": ["right", "left"],
  },
};
// Example solutions:
// rD rF gE gE + whatever else
// 2,7,9 can only be manipulated by rD,rF,gE,gF
// All other tiles can be rotated freely since they connect back to 3, which is a free tile
const button_fns = {
    "A": {
        "red":   () => rotate_tiles([[tiles["1"],  90],[tiles["4"],  90]]),
        "green": () => rotate_tiles([[tiles["8"], -90],[tiles["6"],  90]]),
    },
    "B": {
        "red":   () => rotate_tiles([[tiles["4"],  90],[tiles["3"],  90]]),
        "green": () => rotate_tiles([[tiles["4"],  90],[tiles["6"], -90]]),
    },
    "C": {
        "red":   () => rotate_tiles([[tiles["1"], -90],[tiles["6"], -90]]),
        "green": () => rotate_tiles([[tiles["6"],  90],[tiles["3"], -90]]),
    },
    "D": {
        "red":   () => rotate_tiles([[tiles["2"],  90],[tiles["7"],  90]]),
        "green": () => rotate_tiles([[tiles["5"],  90],[tiles["1"], -90]]),
    },
    "E": {
        "red":   () => rotate_tiles([[tiles["5"], -90],[tiles["4"], -90]]),
        "green": () => rotate_tiles([[tiles["7"], -90],[tiles["9"], -90]]),
    },
    "F": {
        "red":   () => rotate_tiles([[tiles["2"],  90],[tiles["9"],  90]]),
        "green": () => rotate_tiles([[tiles["2"],  90],[tiles["9"], -90]]),
    },
};

function invert_direction(direction) {
    switch (direction) {
        case "up": return "down";
        case "down": return "up";
        case "right": return "left";
        case "left": return "right";
    }
}

function trace_path(tile, in_direction) {
    const directions = direction_combinations[paths[tile.id].type][tile.rotation];
    const index = directions.findIndex(e => e === in_direction);
    if (index === -1) return false;
    const out_direction = directions[index === 0 ? 1 : 0];
    const next_tile = paths[tile.id][out_direction];
    create_laser(tile, out_direction);
    if (next_tile === undefined) {
        return tile.id === tile_ids[6] && out_direction === "right";
    } else {
        return trace_path(next_tile, invert_direction(out_direction));
    }
}

function create_laser(tile, direction) {
    const x = tile.x + tile.width/2;
    const y = tile.y + tile.height/2;
    const rotation = direction === "down" ? 0   :
                     direction === "left" ? 90  :
                     direction === "up"   ? 180 : 
                                            270 ;
    temp_laser_data.push({x, y, rotation, ...laser_light_data});
}

async function test_lens_alignment() {
    await scene.deleteEmbeddedDocuments("AmbientLight", scene.puzzle_lasers);
    scene.puzzle_lasers = [];
    const puzzle_solved = trace_path(tiles[1], "up"); // Always start at tile 1, input up
    (await scene.createEmbeddedDocuments("AmbientLight", temp_laser_data)).forEach(light => 
        scene.puzzle_lasers.push(light.id));
    temp_laser_data = [];
    await disable_barrier(puzzle_solved);
}

async function disable_barrier(disable) {
    scene.updateEmbeddedDocuments("Tile", [{_id: barrier_objs.tile_id, hidden: disable}]);
    scene.updateEmbeddedDocuments("AmbientLight", barrier_objs.light_ids.map(id => ({_id: id, hidden: disable})));
}

async function rotate_tiles(rotations) {
    await scene.updateEmbeddedDocuments("Tile", rotations.map(e => ({
        _id: e[0].id,
        rotation: e[0].rotation + e[1], // Positive e[1] values are clockwise rotations
    })));
    test_lens_alignment();
}

const light_buttons_template = Handlebars.compile(`
    {{#with this as | args |}}
        {{#each lights}}
            <button style="background-color: {{args.color}}; min-width: max-content; white-space: nowrap;" id="{{@key}}{{args.label}}">{{@key}}</button>
        {{/each}}
    {{/with}}
`);
const red_buttons = light_buttons_template({lights: lights, label: "_red", color: "#ff7777"});
const green_buttons = light_buttons_template({lights: lights, label: "_green", color: "#77ff77"});

const lens_buttons_template = Handlebars.compile(`
    {{#with this as | args |}}
        {{#each tiles}}
            <button style="min-width: max-content; white-space: nowrap;" id="{{args.dir}}_{{@key}}">{{@key}}</button>
        {{/each}}
    {{/with}}
`);
const clockwise_buttons = lens_buttons_template({dir: "clockwise", tiles: tile_ids});
const counter_buttons = lens_buttons_template({dir: "counter", tiles: tile_ids});

const dialog_content_template = Handlebars.compile(`
    <form>
        <label style="white-space: nowrap; flex-grow: 0; padding-right: 5px;">Red Buttons </label>
        <div class="form-group" style="flex-direction: row;">
            ${red_buttons}
        </div>
        <hr>
        
        <label style="white-space: nowrap; flex-grow: 0; padding-right: 5px;">Green Buttons </label>
        <div class="form-group" style="flex-direction: row;">
            ${green_buttons}
        </div>
        <hr>
        
        <div class="form-group" style="flex-direction: row;">
            <button style="min-width: max-content; white-space: nowrap;" id="toggle_button_light_color">Toggle Button Light Color</button>
        </div>
        <hr>
        
        {{#if debug}}
        <label style="white-space: nowrap; flex-grow: 0; padding-right: 5px;">Debug options below</label>
        <hr>
        
        <label style="white-space: nowrap; flex-grow: 0; padding-right: 5px;">Rotate clockwise</label>
        <div class="form-group" style="flex-direction: row;">
            ${clockwise_buttons}
        </div>
        <hr>
        
        <label style="white-space: nowrap; flex-grow: 0; padding-right: 5px;">Rotate counter-clockwise</label>
        <div class="form-group" style="flex-direction: row;">
            ${counter_buttons}
        </div>
        <hr>
        
        <div class="form-group" style="flex-direction: row;">
            <button style="min-width: max-content; white-space: nowrap;" id="reset_lenses">Reset Puzzle</button>
        </div>
        <div class="form-group" style="flex-direction: row;">
            <button style="min-width: max-content; white-space: nowrap;" id="solve_lenses">Solve Puzzle</button>
        </div>
        <hr>
        {{/if}}
    </form>
`);
const dialog_content = dialog_content_template({"debug": debug});

const custom_dialog = new Dialog({
    title: `Puzzle Buttons`,
    content: `${dialog_content}`,
    buttons: {close: {label: `Close`}},
    default: "close",
    
    render: (html) => {
        for (const [key, value] of Object.entries(button_fns)) {
            document.getElementById(`${key}_red`).addEventListener("click", value.red);
            document.getElementById(`${key}_green`).addEventListener("click", value.green);
        }
        document.getElementById("toggle_button_light_color").addEventListener("click", e => {
            scene.updateEmbeddedDocuments("AmbientLight", Object.entries(lights).map(([key, val]) => ({
                _id: val.id,
                config: {color: val.config.color === "#00ff00" ? "#ff0000" : "#00ff00"},
            })));
        });
        
        if (debug) {
            for (const [key, value] of Object.entries(tiles)) {
                document.getElementById(`clockwise_${key}`).addEventListener("click", e => rotate_tiles([[value, 90]]));
            }
            for (const [key, value] of Object.entries(tiles)) {
                document.getElementById(`counter_${key}`).addEventListener("click", e => rotate_tiles([[value, -90]]));
            }
            
            document.getElementById("reset_lenses").addEventListener("click", e => {
                scene.updateEmbeddedDocuments("Tile", [
                    {_id: tile_ids[1], rotation: 270},
                    {_id: tile_ids[2], rotation: 90},
                    {_id: tile_ids[3], rotation: 270},
                    {_id: tile_ids[4], rotation: 0},
                    {_id: tile_ids[5], rotation: 180},
                    {_id: tile_ids[6], rotation: 0},
                    {_id: tile_ids[7], rotation: 180},
                    {_id: tile_ids[8], rotation: 0},
                    {_id: tile_ids[9], rotation: 90},
                ]).then(() => test_lens_alignment());
            });
            
            document.getElementById("solve_lenses").addEventListener("click", e => {
                scene.updateEmbeddedDocuments("Tile", [
                    {_id: tile_ids[1], rotation: 90},
                    {_id: tile_ids[2], rotation: 270},
                    {_id: tile_ids[3], rotation: 0},
                    {_id: tile_ids[4], rotation: 180},
                    {_id: tile_ids[5], rotation: 0},
                    {_id: tile_ids[6], rotation: 180},
                    {_id: tile_ids[7], rotation: 90},
                    {_id: tile_ids[8], rotation: 90},
                    {_id: tile_ids[9], rotation: 0},
                ]).then(() => test_lens_alignment());
            });
        }
    },
});

custom_dialog.render(force = true, options = {width: 300});