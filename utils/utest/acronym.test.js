const acronym = require('../acronym');

test("acronym", () => {
    // Check invalid string
    let code = "A8FB";
    expect(acronym.processAcronym(code)).toBe("");

    // Empty string
    code = "";
    expect(acronym.processAcronym(code)).toBe("");

    // Use case
    code = "AAAA";
    let result = acronym.processAcronym(code);

    // Check acronym is valid
    let actual = result.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '');
    expect(actual).toBe(code);

    // Lower case
    code = "ihSX";
    result = acronym.processAcronym(code);

    // Check acronym is valid
    actual = result.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '');
    expect(actual).toBe(code.toUpperCase());

    // Long string
    code = "THENBOSLENS";
    result = acronym.processAcronym(code);
    // Check acronym is valid
    actual = result.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '');
    expect(actual).toBe(code);
});