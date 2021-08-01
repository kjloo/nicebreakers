const filters = require('../filters');
const stub = require('../__stubs__/gameStub');

test('empty list', () => {
    const id = 1;
    expect(filters.getByID([], id)).toBeUndefined();
    expect(filters.getByID("BAD", id)).toBeUndefined();
});

test('list of players', () => {
    const player1 = filters.getByID(stub.players, 1);
    expect(player1).toBeDefined();
    expect(player1).toEqual(stub.jake);

    expect(filters.getByID(stub.players, 2)).toEqual(stub.finn);
    expect(filters.getByID(stub.players, 3)).toEqual(stub.tom);
    expect(filters.getByID(stub.players, 4)).toEqual(stub.bob);
    expect(filters.getByID(stub.players, 5)).toEqual(stub.sean);
    expect(filters.getByID(stub.players, 6)).toEqual(stub.phil);
    expect(filters.getByID(stub.players, 7)).toEqual(stub.sam);
    expect(filters.getByID(stub.players, 8)).toBeUndefined();
});

test('find', () => {
    // get current player named Phil
    let act = filters.findByFilter(stub.players, (player) => player.name === "Phil");
    expect(act).toEqual(stub.phil);
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
    let exp = [stub.bob, stub.sean];
    expect(filters.getByTeamID(stub.players, id)).toEqual(exp);
});

test('full game test', () => {
    // test teams
    expect(filters.getTeams(stub.game)).toEqual(stub.teams);

    // test players
    expect(filters.getPlayers(stub.game)).toEqual(stub.players);

    // get player
    expect(filters.getPlayer(stub.game, 1)).toEqual(stub.jake);
    expect(filters.getPlayer(stub.game, 4)).toEqual(stub.bob);
    expect(filters.getPlayer(stub.game, 7)).toEqual(stub.sam);
});