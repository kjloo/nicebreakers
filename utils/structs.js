class Player {
    constructor(id, name, turn, teamID) {
        this.id = id;
        this.name = name;
        this.turn = turn;
        this.teamID = teamID;
    }
}

class Team {
    constructor(id, name, color, score, turn, players, playerIndex) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.score = score;
        this.turn = turn;
        this.players = players;
        this.playerIndex = playerIndex;
    }
}

class Game {
    constructor(id, teamIndex, teams, players, cachedPlayers, state, answer) {
        this.id = id;
        this.teamIndex = teamIndex;
        this.teams = teams;
        this.players = players;
        this.cachedPlayers = cachedPlayers;
        this.state = state;
        this.answer = answer;
    }
}

class Chat {
    constructor(teamID, data) {
        this.teamID = teamID;
        this.data = data;
    }
}

class ChatEntry {
    constructor(name, message) {
        this.name = name;
        this.message = message;
    }
}

module.exports = {
    Player: Player,
    Team: Team,
    Game: Game,
    Chat: Chat,
    ChatEntry: ChatEntry
}