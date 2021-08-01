import { GameState, GameType, PlayerType } from './enums';

export class Player {
    public id: string;
    public type: PlayerType;
    public name: string;
    public turn: boolean;
    public teamID: number;

    constructor(id: string, type: PlayerType, name: string, turn: boolean, teamID: number) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.turn = turn;
        this.teamID = teamID;
    }
}

export class Team {
    public id: number;
    public name: string;
    public color: string;
    public score: number;
    public turn: boolean;
    public chat: Array<ChatEntry>;
    public players: Array<Player>;
    public playerIndex: number;

    constructor(id: number, name = '', color = '', score = 0, turn = false, chat = [], players = [], playerIndex = 0) {
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

export class Game {
    public id: string;
    public type: GameType;
    public teamIndex: number;
    public teams: Array<Team>;
    public players: Map<string, Player>;
    public cachedPlayers: Array<Player>;
    public state: GameState;
    public answer: string;

    constructor(id: string, type = GameType.MOVIE, teamIndex = 0, teams = [], players = new Map(), cachedPlayers = [], state = GameState.SETUP, answer = "") {
        this.id = id;
        this.type = type;
        this.teamIndex = teamIndex;
        this.teams = teams;
        this.players = players;
        this.cachedPlayers = cachedPlayers;
        this.state = state;
        this.answer = answer;
    }
}

export class ChatEntry {
    public name: string;
    public message: string;

    constructor(name: string, message: string) {
        this.name = name;
        this.message = message;
    }
}