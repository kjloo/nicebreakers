// Generate code
export function generateCode(codeLength: number): string {
    const letters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code: string = "";
    while (code.length < codeLength) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
}

// Create Game Code
export function generateGameCode(games: Map<string, any>, codeLength: number): string {
    if (!(games instanceof Map)) {
        return "";
    }
    let code: string = generateCode(codeLength);
    while (games.has(code)) {
        code = generateCode(codeLength);
    }
    return code;
}

// Create Team ID
export function generateTeamID(teams: Array<any>): number {
    if (!(teams instanceof Array)) {
        return -1;
    }
    // This should be fine as incrementing should yield a new number
    let teamID: number = Date.now();
    while (teams.find((team) => team.id === teamID) !== undefined) {
        teamID = Date.now();
    }
    return teamID;
}