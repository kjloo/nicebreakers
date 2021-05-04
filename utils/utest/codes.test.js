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