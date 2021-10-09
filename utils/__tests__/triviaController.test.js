import { TriviaController } from '../triviaController';
import { GameState } from '../enums';
import { bob, stubGame } from '../__stubs__/gameStub';
import rawData from "../__data__/trivia.json";

jest.mock('../emitter');

let input = Buffer.from(JSON.stringify(rawData));
let controller = new TriviaController(undefined, stubGame);

describe("Trivia Controller Test", () => {

    beforeEach(() => {
        controller.resetGameState(undefined, stubGame);
    });

    test('check start state state', () => {
        expect(controller.isGameStarted(stubGame)).toBe(false);
        controller.gameStateMachine({}, stubGame, GameState.SETUP, {});
        expect(stubGame.state).toBe(GameState.SETUP);
    });

    test('increment game state', () => {
        // Init state
        expect(stubGame.answer).toBeUndefined();
        expect(stubGame.cachedPlayers).toEqual([]);
        // check sum of scores is 0
        let scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
        expect(scores).toBe(0);

        // Can't start an empty game
        let startState = GameState.SETUP;
        let nextState = GameState.SETUP;
        controller.gameStateMachine({}, stubGame, startState, {});
        expect(stubGame.state).toBe(nextState);

        // Load data
        controller.loadData({}, stubGame.id, input);
        startState = GameState.SETUP;
        nextState = GameState.ENTRY;
        let questionCount = controller.questions.length;
        controller.gameStateMachine({}, stubGame, startState, {});
        expect(stubGame.state).toBe(nextState);
        expect(controller.questions.length).toBe(questionCount - 1);

        // Hint
        startState = GameState.ENTRY;
        nextState = GameState.HINT;
        const answer = stubGame.question.answer;
        controller.gameStateMachine({}, stubGame, startState);
        expect(stubGame.state).toBe(nextState);
        // Check answer
        expect(stubGame.question.answer).toBe(answer);

        // Buzz In
        startState = GameState.HINT;
        nextState = GameState.GUESS;
        let team = stubGame.teams.find(team => team.id === bob.teamID);
        expect(team.players.find(player => player.id === bob.id).turn).toBe(false);
        expect(team.turn).toBe(false);
        controller.gameStateMachine({}, stubGame, startState, { player: bob });
        team = stubGame.teams.find(team => team.id === bob.teamID);
        expect(stubGame.state).toBe(nextState);
        expect(team.players.find(player => player.id === bob.id).turn).toBe(true);
        expect(team.turn).toBe(true);

        // Skip
        startState = GameState.HINT;
        nextState = GameState.REVEAL;
        controller.gameStateMachine({}, stubGame, startState);
        expect(stubGame.state).toBe(nextState);
    });

    test('load data', () => {
        expect(controller.questions).toHaveLength(0);
        const resp = controller.loadData({}, stubGame.id, input);
        expect(resp).toBe(true);
        expect(controller.questions).toHaveLength(70);
    });


});