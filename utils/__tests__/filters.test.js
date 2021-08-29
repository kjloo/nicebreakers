import { getByID, findByFilter, getByTeamID, getTeams, getPlayer, getPlayers } from '../filters';
import { players, finn, tom, bob, sean, phil, sam, jake, teams, stubGame } from '../__stubs__/gameStub';

test('empty list', () => {
    const id = "1";
    expect(getByID([], id)).toBeUndefined();
    expect(getByID("BAD", id)).toBeUndefined();
});

test('list of players', () => {
    const player1 = getByID(players, "1");
    expect(player1).toBeDefined();
    expect(player1).toEqual(jake);

    expect(getByID(players, "2")).toEqual(finn);
    expect(getByID(players, "3")).toEqual(tom);
    expect(getByID(players, "4")).toEqual(bob);
    expect(getByID(players, "5")).toEqual(sean);
    expect(getByID(players, "6")).toEqual(phil);
    expect(getByID(players, "7")).toEqual(sam);
    expect(getByID(players, "8")).toBeUndefined();
});

test('find', () => {
    // get current player named Phil
    let act = findByFilter(players, (player) => player.name === "Phil");
    expect(act).toEqual(phil);
});

test('Team ID', () => {
    const id = 1042;

    // test bad values
    expect(getByTeamID(undefined, id)).toBeUndefined();
    expect(getByTeamID(new Map(), id)).toBeUndefined();
    expect(getByTeamID("BAD", id)).toBeUndefined();

    // empty
    expect(getByTeamID([], id)).toEqual([]);

    // Test correct
    let exp = [bob, sean];
    expect(getByTeamID(players, id)).toEqual(exp);
});

test('full game test', () => {
    // test teams
    expect(getTeams(stubGame)).toEqual(teams);

    // test players
    expect(getPlayers(stubGame)).toEqual(players);

    // get player
    expect(getPlayer(stubGame, "1")).toEqual(jake);
    expect(getPlayer(stubGame, "4")).toEqual(bob);
    expect(getPlayer(stubGame, "7")).toEqual(sam);
});