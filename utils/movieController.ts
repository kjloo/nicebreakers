import logger from './logger';
import { GameState } from './enums';
import { GameController } from './gameController';
const emitter = require('./emitter');

export class MovieController extends GameController {

    private getCurrentPlayer(game) {
        const team = this.getCurrentTeam(game);
        if (team === undefined) {
            logger.error("Invalid team index " + game.teamIndex);
            return undefined;
        }
        // Get player
        return team.players[team.playerIndex];
    }

    private getCurrentTeam(game) {
        return game.teams[game.teamIndex];
    }

    private incrementTeamIndex(game) {
        game.teamIndex++;
        // Check if valid
        if (game.teamIndex >= game.teams.length) {
            game.teamIndex = 0;
        }
    }

    private incrementPlayerIndex(game) {
        let teams = game.teams;
        teams[game.teamIndex].playerIndex++;
        // Check if valid
        if (teams[game.teamIndex].playerIndex >= teams[game.teamIndex].players.length) {
            teams[game.teamIndex].playerIndex = 0;
        }
    }

    private changeTeamTurns(game) {
        // Set old team to false
        let team = this.getCurrentTeam(game);
        team.turn = false;

        // Increment
        this.incrementTeamIndex(game);
        // Set new team to true
        team = this.getCurrentTeam(game);
        team.turn = true;
    }

    private changePlayerTurns(game) {
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
    private incrementGameState(s, game) {
        // Move the turn along
        this.changePlayerTurns(game);
        // Update sockets
        emitter.updatePlayers(s, game);
        emitter.updateTeams(s, game);
    }

    private nextRound(s, game) {
        // change turns
        this.incrementGameState(s, game);
        // back to beginning
        emitter.revealAnswer(s, game);
        emitter.updateState(s, game, GameState.REVEAL);
    }

    private updateScore(s, game, state, correct) {
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
                emitter.updateState(s, game, GameState.GUESS);
            } else {
                this.nextRound(s, game);
            }
        }
    }

    public override gameStateMachine(s, game, state, args): void {
        switch (state) {
            case GameState.SETUP:
                // Set first turn
                this.incrementGameState(s, game);
                emitter.updateState(s, game, GameState.ENTRY);
                break;
            case GameState.ENTRY:
                game.answer = args.answer;
                emitter.updateState(s, game, GameState.HINT);
                break;
            case GameState.HINT:
                emitter.updateState(s, game, GameState.STEAL);
                break;
            case GameState.STEAL:
            case GameState.GUESS:
                this.updateScore(s, game, state, args.correct);
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