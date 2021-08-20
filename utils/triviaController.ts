import logger from './logger';
import { GameState } from './enums';
import { GameController } from './gameController';
import { Game, Team } from './structs';
const emitter = require('./emitter');

export class TriviaController extends GameController {

    private sendState(s, game: Game) {
        // Update sockets
        emitter.updateTeams(s, game);
    }

    private nextRound(s, game: Game) {
        this.sendState(s, game)
        // back to beginning
        emitter.revealAnswer(s, game);
        emitter.updateState(s, game, GameState.REVEAL);
    }

    private updateScore(s, game: Game, state: GameState, correct: boolean) {
        // check if correct answer given
        if (correct) {
            // update score
            game.teams = game.teams.map((team) => {
                if (team.turn) {
                    return { ...team, score: team.score + 1 }
                } else {
                    return team;
                }
            });
            this.nextRound(s, game);
        } else {
            if (state === GameState.GUESS) {
                // switch turns
                this.changeTeamTurns(game)
                this.sendState(s, game);
                emitter.updateState(s, game, GameState.STEAL);
            } else {
                this.nextRound(s, game);
            }
        }
    }

    private buzzIn(s, game: Game, teamID: number) {
        // Prevent race condition. Make sure only 1 team is set
        if (game.teams.some((team: Team) => team.turn)) {
            return;
        }
        // Set team turn
        game.teams = game.teams.map((team: Team) => {
            if (team.id !== teamID) {
                return team;
            }
            return { ...team, turn: true };
        });
        this.sendState(s, game)
    }

    public override gameStateMachine(s, game: Game, state: GameState, args): void {
        switch (state) {
            case GameState.SETUP:
                emitter.updateState(s, game, GameState.ENTRY);
                break;
            case GameState.ENTRY:
                // Clear turns
                game.teams = game.teams.map((team: Team) => {
                    return { ...team, turn: false };
                });
                this.sendState(s, game)
                emitter.updateState(s, game, GameState.HINT);
                break;
            case GameState.HINT:
                this.buzzIn(s, game, args.teamID);
                emitter.updateState(s, game, GameState.GUESS);
                break;
            case GameState.STEAL:
            case GameState.GUESS:
                this.updateScore(s, game, state, args.correct)
                break;
            case GameState.REVEAL:
                emitter.updateState(s, game, GameState.ENTRY);
                break;
            case GameState.END:
                // Reset game
                emitter.updateState(s, game, GameState.SETUP);
                // Set winner
                emitter.setWinner(s, game);
                // Reset to beginning
                this.resetGameState(s, game);
                break;
        }
    }
};