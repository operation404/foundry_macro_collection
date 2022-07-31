function tokenUpdate(lightData) {
  canvas.tokens.controlled.map(token => token.document.update({
      light: lightData,
  }));
}

let torchAnimation = {"type": "torch", "speed": 4, "intensity": 5, "reverse": false};

let dialogEditor = new Dialog({
  title: `Token Lighting Controls`,
  content: `Pick the light source the selected token is holding.<hr>`,
  buttons: {
    nolight: {
      label: `No Light`,
      callback: () => {
        tokenUpdate({"dim": 0, "bright": 0, "angle": 360, "luminosity": 0.5});
      }
    },
    torch: {
      label: `Torch`,
      callback: () => {
        tokenUpdate({"dim": 30, "bright": 5, "color": "#ff8000", "alpha": 0.6, "angle": 360, "luminosity": 0.35, "gradual": true, "animation": torchAnimation});
      }
    },
  },
  default: "nolight",
  close: () => {}
});

dialogEditor.render(true);