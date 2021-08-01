import { generateCode, generateGameCode, generateTeamID } from '../codes';

test("generate code", () => {
    // Check length 0
    expect(generateCode(0)).toBe("");

    // Check negative length
    expect(generateCode(-10)).toBe("");

    // Validate function
    let length = 10;
    expect(generateCode(length).length).toBe(length);
});

test("games", () => {
    let length = 4;
    // Test exceptions
    expect(generateGameCode([], length)).toBe("");
    expect(generateGameCode({}, length)).toBe("");

    // Functional test
    let games = new Map();
    let code = generateGameCode(games, length);
    expect(code.length).toBe(length);
});

test("teams", () => {
    // Test exceptions
    expect(generateTeamID(Map, length)).toBe(-1);
    expect(generateTeamID({}, length)).toBe(-1);

    // Mock date function
    jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
    // Functional test
    let teams = [];
    let code = generateTeamID(teams);
    const exp = 1557831718135;
    expect(code).toBeDefined();
    expect(code).toBe(exp);

    // Test call again should give different answer
    code = generateTeamID(teams, code);
    expect(code).toBeDefined();
    expect(code).not.toBe(exp);
});