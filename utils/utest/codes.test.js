const codes = require('../codes');

test("generate code", () => {
    // Check length 0
    expect(codes.generateCode(0)).toBe("");

    // Check negative length
    expect(codes.generateCode(-10)).toBe("");

    // Validate function
    let length = 10;
    expect(codes.generateCode(length).length).toBe(length);
});

test("games", () => {
    let length = 4;
    // Test exceptions
    expect(codes.generateGameCode([], length)).toBe("");
    expect(codes.generateGameCode({}, length)).toBe("");

    // Functional test
    let games = new Map();
    let code = codes.generateGameCode(games, length);
    expect(code.length).toBe(length);
});

test("teams", () => {
    // Test exceptions
    expect(codes.generateTeamID(Map, length)).toBe("");
    expect(codes.generateTeamID({}, length)).toBe("");

    // Mock date function
    jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
    // Functional test
    let teams = [];
    let code = codes.generateTeamID(teams);
    const exp = 1557831718135;
    expect(code).toBeDefined();
    expect(code).toBe(exp);

    // Test call again should give different answer
    code = codes.generateTeamID(teams, code);
    expect(code).toBeDefined();
    expect(code).not.toBe(exp);
});