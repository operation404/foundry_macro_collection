const table = game.tables.entities.find(t => t.name === "Scatter Direction");
const direction = table.roll().results[0].text;
const distance = new Roll(`3d6`).roll().result;

const scatter_html = `<span style="float: left;">Rocket scatter: 
                        ${distance}m ${direction}.</span>`;

ChatMessage.create({
    user: game.user._id,
    speaker: ChatMessage.getSpeaker({token: actor}),
    content: scatter_html
});