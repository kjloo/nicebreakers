const filters = require('../filters');
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

const fish = new structs.Team(1042, 'Fish', '#FF6622', 0, false, [], [bob, sean], 0);
const cat = new structs.Team(5431, 'Cat', '#993355', 0, true, [], [phil, sam], 0);
teams.push(fish, cat);
players.push(jake, finn, tom, bob, sean, phil, sam);
let game = new structs.Game("ABDS", -1, teams, [jake, finn, tom], [], enums.GameState.ENTRY, "");

test('empty list', () => {
    const id = 1;
    expect(filters.getByID([], id)).toBeUndefined();
    expect(filters.getByID("BAD", id)).toBeUndefined();
});

test('list of players', () => {
    const player1 = filters.getByID(players, 1);
    expect(player1).toBeDefined();
    expect(player1).toEqual(jake);

    expect(filters.getByID(players, 2)).toEqual(finn);
    expect(filters.getByID(players, 3)).toEqual(tom);
    expect(filters.getByID(players, 4)).toEqual(bob);
    expect(filters.getByID(players, 5)).toEqual(sean);
    expect(filters.getByID(players, 6)).toEqual(phil);
    expect(filters.getByID(players, 7)).toEqual(sam);
    expect(filters.getByID(players, 8)).toBeUndefined();
});

test('find', () => {
    // Test still valid, but Players are usually not in Maps
    const map = new Map([[1, bob], [2, sean], [3, phil], [4, sam]]);

    // get current player named Phil
    let act = filters.findByFilter(map, (player) => player.name === "Phil");
    expect(act).toEqual(phil);
});

test('Team ID', () => {
    const id = 1042;

    // test bad values
    expect(filters.getByTeamID(undefined, id)).toBeUndefined();
    expect(filters.getByTeamID(new Map(), id)).toBeUndefined();
    expect(filters.getByTeamID("BAD", id)).toBeUndefined();

    // empty
    expect(filters.getByTeamID([], id)).toEqual([]);

    // Test correct
    let exp = [bob, sean];
    expect(filters.getByTeamID(players, id)).toEqual(exp);
});

test('full game test', () => {
    // test teams
    expect(filters.getTeams(game)).toEqual(teams);

    // test players
    expect(filters.getPlayers(game)).toEqual(players);

    // get player
    expect(filters.getPlayer(game, 1)).toEqual(jake);
    expect(filters.getPlayer(game, 4)).toEqual(bob);
    expect(filters.getPlayer(game, 7)).toEqual(sam);
});