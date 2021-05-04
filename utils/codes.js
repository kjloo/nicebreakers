// Generate code
const generateCode = (codeLength) => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";
    while (code.length < codeLength) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
}

// Create Game Code
const generateGameCode = (games, codeLength) => {
    if (!(games instanceof Map)) {
        return "";
    }
    let code = generateCode(codeLength);
    while (games.has(code)) {
        code = generateCode(codeLength);
    }
    return code;
}

// Create Team ID
const generateTeamID = (teams) => {
    if (!(teams instanceof Array)) {
        return "";
    }
    // This should be fine as incrementing should yield a new number
    let teamID = Date.now();
    while (teams.find((team) => team.id === teamID) !== undefined) {
        teamID = Date.now();
    }
    return teamID;
}

module.exports = {
    generateCode: generateCode,
    generateGameCode: generateGameCode,
    generateTeamID: generateTeamID
}