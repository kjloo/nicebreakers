import logger from './logger';

import { GameState } from './enums';
import { GameController } from './gameController';
import { Card, Game, Player, Question, Team } from './structs';
import { updateState, revealAnswer, updateTeams, setWinner, setReady, sendError, updatePlayers } from './emitter';
import { Server } from 'socket.io';

export class TopFiveController extends GameController {

    public constructor(s: Server, game: Game) {
        super(s, game);
        // ready flag set by default
        this.ready = true;
    }

    private sendState(s: Server, game: Game) {
        // Update sockets
        updatePlayers(s, game);
        updateTeams(s, game);
    }

    private nextRound(s: Server, game: Game) {
        this.sendState(s, game)
        // back to beginning
        revealAnswer(s, game);
        updateState(s, game, GameState.REVEAL);
    }

    /**
     * Create a new list of teams with updated score.
     * @param game current game context
     * @param delta change to the score
     * @returns array of teams
     */
    private updateScore(game: Game, delta: number): Array<Team> {
        // update score
        return game.teams.map((team: Team): Team => {
            if (team.turn) {
                return { ...team, score: team.score + delta }
            } else {
                return team;
            }
        });
    }

    /**
     * Execute logic when an answer is received
     * @param s SocketIO connected to client
     * @param game current game context
     * @param state current game state
     * @param correct whether a correct answer was provided
     */
    private handleAnswer(s: Server, game: Game, state: GameState, correct: boolean): void {
        // check if correct answer given
        if (correct) {
            // update score
            game.teams = this.updateScore(game, game.question.points);
            this.nextRound(s, game);
        } else {
            if (state === GameState.GUESS) {
                // deduct points
                game.teams = this.updateScore(game, -game.question.points);
                // switch turns
                this.changeTeamTurns(game)
                this.sendState(s, game);
                updateState(s, game, GameState.STEAL);
            } else {
                this.nextRound(s, game);
            }
        }
    }

    /**
     * Set game context based on which team buzzes in. 
     * @param s SocketIO connected to client
     * @param game current game context
     * @param player player object that is current
     */
    private buzzIn(s: Server, game: Game, player: Player): void {
        // Prevent race condition. Make sure only 1 team is set
        if (game.teams.some((team: Team) => team.turn)) {
            return;
        }
        // Set team turn
        game.teams = game.teams.map((team: Team) => {
            if (team.id !== player.teamID) {
                return team;
            }
            game.teamIndex = game.teams.indexOf(team);
            // Set player turn
            team.players = team.players.map((p: Player) => {
                if (p.id !== player.id) {
                    return p;
                }
                return { ...p, turn: true };
            });
            return { ...team, turn: true };
        });
        this.sendState(s, game)
    }

    /**
     * Responsible for handling transition to next game state
     * @param s SocketIO server object connected to client
     * @param game Game context object
     * @param state The current game state
     * @param args Additional arguments
     */
    public override gameStateMachine(s: Server, game: Game, state: GameState, args: any = {}): void {
        switch (state) {
            case GameState.SETUP:
                break;
        }
    }
};