function tokenUpdate(vision, dimSight) {
  canvas.tokens.controlled.map(token => token.document.update({
      vision,
      dimSight
  }));
}

let torchAnimation = {"type": "torch", "speed": 4, "intensity": 5, "reverse": false};

let dialogEditor = new Dialog({
  title: `Token Vision Controls`,
  content: `Pick the vision type the selected token has.<hr>`,
  buttons: {
    /*none: {
      label: `No Vision`,
      callback: () => {
        tokenUpdate(false, 0);
      }
    },*/
    standard: {
      label: `Standard Vision`,
      callback: () => {
        tokenUpdate(true, 0);
      }
    },
    darksight: {
      label: `Darksight`,
      callback: () => {
        tokenUpdate(true, 1000);
      }
    },
  },
  default: "standard",
  close: () => {}
});

dialogEditor.render(true);