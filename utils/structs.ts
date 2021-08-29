import { GameState, GameType, PlayerType } from './enums';
import { GameController } from './gameController';

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
    public question: Question;
    public controller: GameController;

    constructor(id: string, type = GameType.MOVIE, teamIndex = 0, teams = [], players = new Map(), cachedPlayers = [], state = GameState.SETUP, question = undefined) {
        this.id = id;
        this.type = type;
        this.teamIndex = teamIndex;
        this.teams = teams;
        this.players = players;
        this.cachedPlayers = cachedPlayers;
        this.state = state;
        this.question = question;
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

export interface Question {
    category: string;
    question: string;
    answer: string;
    points: number;
}

export interface Card {
    category: string;
    questions: Array<Question>
}