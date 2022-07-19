//Rocks Fall, everyone dies.

let targets = []
game.user.targets.forEach(i => {
let name = i.name;
targets.push(name);
})

if(targets.length === 0) {targets = "no one, this time"}

let roll = new Roll(`8d10+100`).roll();
console.log(this.roll)

let results_html = `<h2>Cave In!</h2>
The cave collapses from above, dealing <a class="inline-result"><i class="fas fa-dice-d20"></i>${roll.total}</a> damage to <strong>${targets}</strong>.`

ChatMessage.create({
user: game.user._id,
speaker: ChatMessage.getSpeaker({token: actor}),
content: results_html
});