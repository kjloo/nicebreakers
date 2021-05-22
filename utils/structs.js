class Player {
    constructor(id, gameID, name, turn, teamID) {
        this.id = id;
        this.gameID = gameID;
        this.name = name;
        this.turn = turn;
        this.teamID = teamID;
    }
}

class Team {
    constructor(id, name, color, score, turn, chat, players, playerIndex) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.score = score;
        this.turn = turn;
        this.chat = chat;
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
    ChatEntry: ChatEntry
}