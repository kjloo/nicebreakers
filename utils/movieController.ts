import logger from './logger';
import { GameState } from './enums';
import { GameController } from './gameController';
import { Game } from './structs';
import { revealAnswer, setReady, updatePlayers, updateState, updateTeams } from './emitter';
import { Server } from 'socket.io';

export class MovieController extends GameController {

    public constructor(s: Server, game: Game) {
        super(s, game);
        // ready flag set by default
        setReady(s, game.id, true);
    }

    private getCurrentPlayer(game: Game) {
        const team = this.getCurrentTeam(game);
        if (team === undefined) {
            logger.error("Invalid team index " + game.teamIndex);
            return undefined;
        }
        // Get player
        return team.players[team.playerIndex];
    }

    private incrementPlayerIndex(game: Game) {
        let teams = game.teams;
        teams[game.teamIndex].playerIndex++;
        // Check if valid
        if (teams[game.teamIndex].playerIndex >= teams[game.teamIndex].players.length) {
            teams[game.teamIndex].playerIndex = 0;
        }
    }

    private changePlayerTurns(game: Game) {
        // Set old player to false
        let player = this.getCurrentPlayer(game);
        if (player === undefined) {
            logger.error("Could not get player!");
            console.error("Could not get player!");
            return;
        }
        player.turn = false;
        // Move to next player
        this.incrementPlayerIndex(game);

        // Change teams
        this.changeTeamTurns(game);
        // Set new player to true
        player = this.getCurrentPlayer(game);
        player.turn = true;
    }

    // Game State Machine
    private incrementGameState(s: Server, game: Game) {
        // Move the turn along
        this.changePlayerTurns(game);
        // Update sockets
        updatePlayers(s, game);
        updateTeams(s, game);
    }

    private nextRound(s: Server, game: Game) {
        // change turns
        this.incrementGameState(s, game);
        // back to beginning
        revealAnswer(s, game);
        updateState(s, game, GameState.REVEAL);
    }

    private updateScore(s: Server, game: Game, state: GameState, correct: boolean) {
        // check if correct answer given
        if (correct) {
            // give point based on state
            // give point to team with turn if GUESS else STEAL
            let point = (state === GameState.GUESS);
            // update score
            game.teams = game.teams.map((team) => {
                if (team.turn === point) {
                    return { ...team, score: team.score + 1 }
                } else {
                    return team;
                }
            });
            this.nextRound(s, game);
        } else {
            if (state === GameState.STEAL) {
                updateState(s, game, GameState.GUESS);
            } else {
                this.nextRound(s, game);
            }
        }
    }

    public override gameStateMachine(s: Server, game: Game, state: GameState, args): void {
        switch (state) {
            case GameState.SETUP:
                // Set first turn
                this.incrementGameState(s, game);
                updateState(s, game, GameState.ENTRY);
                break;
            case GameState.ENTRY:
                game.question = { answer: args.answer };
                updateState(s, game, GameState.HINT);
                break;
            case GameState.HINT:
                updateState(s, game, GameState.STEAL);
                break;
            case GameState.STEAL:
            case GameState.GUESS:
                this.updateScore(s, game, state, args.correct);
                break;
            case GameState.REVEAL:
                updateState(s, game, GameState.ENTRY);
                break;
            case GameState.END:
                this.endGame(s, game);
                break;
        }
    }

    public override loadData(s: Server, gameID: string, data: Buffer): boolean {
        return true;
    }
};