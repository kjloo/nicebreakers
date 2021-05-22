
const structs = require('../structs');
const enums = require('../enums');
// Setup in memory data
const players = [];
const teams = [];

const jake = new structs.Player(1, "Jake", false, -1);
const finn = new structs.Player(2, "Finn", false, -1);
const tom = new structs.Player(3, "Tom", true, -1);
const bob = new structs.Player(4, "Bob", false, 1042);
const sean = new structs.Player(5, "Sean", false, 1042);
const phil = new structs.Player(6, "Phil", false, 5431);
const sam = new structs.Player(7, "Sam", false, 5431);
const charles = new structs.Player(8, "Charles", false, 5431);

const fish = new structs.Team(1042, 'Fish', '#FF6622', 0, false, [], [bob, sean], 0);
const cat = new structs.Team(5431, 'Cat', '#993355', 0, true, [], [phil, sam], 0);
teams.push(fish, cat);
players.push(jake, finn, tom, bob, sean, phil, sam);
let game = new structs.Game("ABDS", 0, teams, [jake, finn, tom], [charles], enums.GameState.SETUP, "");

module.exports = {
    game: game,
    teams: teams,
    players: players,
    jake: jake,
    finn: finn,
    tom: tom,
    bob: bob,
    sean: sean,
    phil: phil,
    sam: sam,
    charles: charles,
    fish: fish,
    cat: cat
};