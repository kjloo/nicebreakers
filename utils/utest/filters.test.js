const filters = require('../filters');
const structs = require('../structs');

test('empty list', () => {
    const id = 1;
    expect(filters.getByID(new Map(), id)).toBeUndefined();
});

test('list of players', () => {
    const jake = new structs.Player(1, "Jake", false, -1);
    const finn = new structs.Player(2, "Finn", false, -1);
    const tom = new structs.Player(3, "Tom", true, -1);
    let players = new Map([[1, jake], [2, finn], [3, tom]]);

    const player1 = filters.getByID(players, 1);
    expect(player1).toBeDefined();
    expect(player1).toEqual(jake);

    expect(filters.getByID(players, 2)).toEqual(finn);
    expect(filters.getByID(players, 3)).toEqual(tom);
    expect(filters.getByID(players, 4)).toBeUndefined();
});

test('find', () => {
    const bob = new structs.Player(1, "Bob", true, 1);
    const sean = new structs.Player(2, "Sean", false, 1);
    const phil = new structs.Player(3, "Phil", false, 2);
    const sam = new structs.Player(4, "Sam", false, 2);
    let map = new Map([[1, bob], [2, sean], [3, phil], [4, sam]]);

    // get current player named Phil
    let act = filters.findByFilter(map, (player) => player.name === "Phil");
    expect(act).toEqual(phil);
});