
const structs = require('../structs');
const enums = require('../enums');
// Setup in memory data
const jake = new structs.Player(1, enums.PlayerType.PLAYER, "Jake", false, -1);
const finn = new structs.Player(2, enums.PlayerType.PLAYER, "Finn", false, -1);
const tom = new structs.Player(3, enums.PlayerType.PLAYER, "Tom", true, -1);
const bob = new structs.Player(4, enums.PlayerType.PLAYER, "Bob", false, 1042);
const sean = new structs.Player(5, enums.PlayerType.PLAYER, "Sean", false, 1042);
const phil = new structs.Player(6, enums.PlayerType.PLAYER, "Phil", false, 5431);
const sam = new structs.Player(7, enums.PlayerType.PLAYER, "Sam", false, 5431);
const charles = new structs.Player(8, enums.PlayerType.PLAYER, "Charles", false, 5431);

const fish = new structs.Team(1042, 'Fish', '#FF6622', 0, true, [], [bob, sean], 0);
const cat = new structs.Team(5431, 'Cat', '#993355', 0, false, [], [phil, sam], 0);
const teams = [fish, cat];
const players = [jake, finn, tom, bob, sean, phil, sam];
const game = new structs.Game("ABDS", enums.GameType.MOVIE, 0, teams, new Map([[jake.id, jake], [finn.id, finn], [tom.id, tom]]), [charles], enums.GameState.SETUP, "");

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