import { MovieController } from '../movieController';
import { GameState } from '../enums';
import { stubGame } from '../__stubs__/gameStub';

jest.mock('../emitter');

let controller = new MovieController(undefined, stubGame);

describe('Movie Controller', () => {

    beforeEach(() => {
        controller.resetGameState(undefined, stubGame);
    });

    test('check current player', () => {
        let teamIndex = 0;
        let playerIndex = 0;
        // Player should be first player on first team
        expect(controller.getCurrentPlayer(stubGame)).toEqual(stubGame.teams[teamIndex].players[playerIndex]);
        // Move to next player
        controller.incrementPlayerIndex(stubGame);
        playerIndex = 1;
        // Player should be sean
        expect(controller.getCurrentPlayer(stubGame)).toEqual(stubGame.teams[teamIndex].players[playerIndex]);
        // Move to next player
        controller.incrementPlayerIndex(stubGame);
        // Should wrap back around. Player should be bob
        playerIndex = 0;
        expect(controller.getCurrentPlayer(stubGame)).toEqual(stubGame.teams[teamIndex].players[playerIndex]);

        // Excercise player turn change
        controller.changePlayerTurns(stubGame);
        teamIndex = 1;
        expect(controller.getCurrentPlayer(stubGame)).toEqual(stubGame.teams[teamIndex].players[playerIndex]);
        expect(stubGame.teams[0].players[0].turn).toBe(false);
        expect(stubGame.teams[teamIndex].players[playerIndex].turn).toBe(true);
        expect(controller.getCurrentTeam(stubGame)).toEqual(stubGame.teams[teamIndex]);

        // Exercise increment game state
        controller.incrementGameState(undefined, stubGame);
        teamIndex = 0;
        playerIndex = 1;
        expect(controller.getCurrentPlayer(stubGame)).toEqual(stubGame.teams[teamIndex].players[playerIndex]);
        expect(stubGame.teams[1].players[0].turn).toBe(false);
        expect(stubGame.teams[teamIndex].players[playerIndex].turn).toBe(true);
        expect(controller.getCurrentTeam(stubGame)).toEqual(stubGame.teams[teamIndex]);
    });

    test('check current team', () => {
        let teamIndex = 0;
        // Team should be fish
        expect(controller.getCurrentTeam(stubGame)).toEqual(stubGame.teams[teamIndex]);
        // Move to next team
        controller.incrementTeamIndex(stubGame);
        teamIndex = 1;
        // Team should be cat
        expect(controller.getCurrentTeam(stubGame)).toEqual(stubGame.teams[teamIndex]);
        // Move to next team
        controller.incrementTeamIndex(stubGame);
        teamIndex = 0;
        // Should wrap back around. Team should be fish
        expect(controller.getCurrentTeam(stubGame)).toEqual(stubGame.teams[teamIndex]);

        // Use change team turns
        controller.changeTeamTurns(stubGame);
        teamIndex = 1;
        // Team should be cat
        expect(controller.getCurrentTeam(stubGame)).toEqual(stubGame.teams[teamIndex]);
        expect(stubGame.teams[teamIndex].turn).toBe(true);
        expect(stubGame.teams[0].turn).toBe(false);
    });

    describe('increment game state', () => {
        function startGame() {
            // Start game
            controller.gameStateMachine({}, stubGame, GameState.SETUP, {});
        }
        test('initial state', () => {
            // Init state
            expect(stubGame.answer).toBeUndefined();
            expect(stubGame.cachedPlayers).toEqual([]);
            // check sum of scores is 0
            let scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
            expect(scores).toBe(0);
            expect(controller.ready).toBe(true);
        });

        test('should start the game', () => {
            startGame();
            expect(stubGame.state).toBe(GameState.ENTRY);
        });

        test('should move to hint state', () => {
            // Hint
            let startState = GameState.ENTRY;
            let nextState = GameState.HINT;
            const answer = "Cats";
            controller.gameStateMachine({}, stubGame, startState, { answer: answer });
            expect(stubGame.state).toBe(nextState);
            // Check answer
            expect(stubGame.question.answer).toBe(answer);
        });

        test('should allow steal first', () => {
            // Steal
            let startState = GameState.HINT;
            let nextState = GameState.STEAL;
            controller.gameStateMachine({}, stubGame, startState, {});
            expect(stubGame.state).toBe(nextState);
        });

        test('should allow guess on missed steal', () => {
            startGame();
            // Guess
            let startState = GameState.STEAL;
            let nextState = GameState.GUESS;
            let scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
            controller.gameStateMachine({}, stubGame, startState, { correct: false });
            expect(stubGame.state).toBe(nextState);

            // check sum of scores is not changed
            expect(stubGame.teams.reduce((acc, cur) => acc + cur.score, 0)).toBe(scores);

        });

        test('should reveal answer on successful steal', () => {
            startGame();
            // Reveal
            let startState = GameState.STEAL;
            let nextState = GameState.REVEAL;
            let scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
            controller.gameStateMachine({}, stubGame, startState, { correct: true });
            expect(stubGame.state).toBe(nextState);

            // check sum of scores is 1 more
            expect(stubGame.teams.reduce((acc, cur) => acc + cur.score, 0)).toBe(scores + 1);
        });

        test('should properly increment score on successful guess', () => {
            startGame();
            let startState = GameState.GUESS;
            let nextState = GameState.REVEAL;
            let scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
            controller.gameStateMachine({}, stubGame, startState, { correct: true });
            expect(stubGame.state).toBe(nextState);

            // check sum of scores is 1 more
            expect(stubGame.teams.reduce((acc, cur) => acc + cur.score, 0)).toBe(scores + 1);
        });

        test('should reveal answer once all guesses are complete', () => {
            startGame();
            let startState = GameState.GUESS;
            let nextState = GameState.REVEAL;
            let scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
            controller.gameStateMachine({}, stubGame, startState, { correct: false });
            expect(stubGame.state).toBe(nextState);

            // check sum of scores is not changed
            expect(stubGame.teams.reduce((acc, cur) => acc + cur.score, 0)).toBe(scores);
        });

        test('should continue game', () => {
            // ENTRY
            let startState = GameState.REVEAL;
            let nextState = GameState.ENTRY;
            controller.gameStateMachine({}, stubGame, startState, {});
            expect(stubGame.state).toBe(nextState);
        });

        test('should be able to end game', () => {
            // END
            let startState = GameState.END;
            let nextState = GameState.SETUP;
            controller.gameStateMachine({}, stubGame, startState, {});
            expect(stubGame.state).toBe(nextState);
            // check no cached players
            expect(stubGame.cachedPlayers).toEqual([]);
            // check sum of scores is 0
            let scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
            expect(scores).toBe(0);
            // check no turn set
            let turn = stubGame.teams.reduce((acc, cur) => acc || cur.turn, false);
            expect(turn).toBe(false);
        });
    });
});
