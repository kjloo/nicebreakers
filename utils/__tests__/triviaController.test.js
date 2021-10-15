import { TriviaController } from '../triviaController';
import { GameState } from '../enums';
import { bob, sam, stubGame } from '../__stubs__/gameStub';
import rawData from "../__data__/trivia.json";

jest.mock('../emitter');

let input = Buffer.from(JSON.stringify(rawData));
let controller = new TriviaController(stubGame);

describe("Trivia Controller Test", () => {

    beforeEach(() => {
        controller.resetGameState(undefined, stubGame);
    });

    test('check start state state', () => {
        expect(controller.isGameStarted(stubGame)).toBe(false);
        controller.gameStateMachine({}, {}, stubGame, GameState.SETUP, {});
        expect(stubGame.state).toBe(GameState.SETUP);
        expect(controller.ready).toBe(false);
    });

    describe('increment game state', () => {

        function loadQuestions() {
            // Load data
            controller.loadData({}, stubGame.id, input);
        }

        test('start trivia game', () => {
            // Init state
            expect(stubGame.answer).toBeUndefined();
            expect(stubGame.cachedPlayers).toEqual([]);
            // check sum of scores is 0
            let scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
            expect(scores).toBe(0);
        });

        test('should not start an empty game', () => {
            // Can't start an empty game
            let startState = GameState.SETUP;
            let nextState = GameState.SETUP;
            controller.gameStateMachine({}, {}, stubGame, startState, {});
            expect(stubGame.state).toBe(nextState);
        })

        test('should start a game and load a question', () => {
            // Load data
            loadQuestions();
            let startState = GameState.SETUP;
            let nextState = GameState.ENTRY;
            let questionCount = controller.questions.length;
            expect(stubGame.question).toBeNull();
            controller.gameStateMachine({}, {}, stubGame, startState, {});
            expect(stubGame.state).toBe(nextState);
            expect(controller.questions.length).toBe(questionCount - 1);
            expect(stubGame.question).toBeDefined();
        });

        test('should move into hint state', () => {
            // Hint
            loadQuestions();
            let startState = GameState.ENTRY;
            let nextState = GameState.HINT;
            const answer = stubGame.question.answer;
            controller.gameStateMachine({}, {}, stubGame, startState);
            expect(stubGame.state).toBe(nextState);
            // Check answer
            expect(stubGame.question.answer).toBe(answer);
            expect(stubGame.question.answer).toBeDefined();
        });

        test('should allow player to buzz in', () => {
            // Buzz In
            loadQuestions();
            let startState = GameState.HINT;
            let nextState = GameState.GUESS;
            let team = stubGame.teams.find(team => team.id === bob.teamID);
            expect(team.players.find(player => player.id === bob.id).turn).toBe(false);
            expect(team.turn).toBe(false);
            controller.gameStateMachine({}, {}, stubGame, startState, { player: bob });
            team = stubGame.teams.find(team => team.id === bob.teamID);
            expect(stubGame.state).toBe(nextState);
            expect(team.players.find(player => player.id === bob.id).turn).toBe(true);
            expect(team.turn).toBe(true);
        });

        test('should allow game to skip answering', () => {
            // Skip
            loadQuestions();
            let startState = GameState.HINT;
            let nextState = GameState.REVEAL;
            controller.gameStateMachine({}, {}, stubGame, startState);
            expect(stubGame.state).toBe(nextState);
        });

        test('should properly deduct points on wrong guess', () => {
            // Guess Wrong
            loadQuestions();
            let startState = GameState.HINT;
            let nextState = GameState.GUESS;
            controller.gameStateMachine({}, {}, stubGame, startState, { player: bob });
            let team = stubGame.teams.find(team => team.id === bob.teamID);
            let score = team.score;
            let delta = stubGame.question.points;
            startState = GameState.GUESS;
            nextState = GameState.STEAL;
            controller.gameStateMachine({}, {}, stubGame, startState, { correct: false });
            team = stubGame.teams.find(team => team.id === bob.teamID);
            expect(stubGame.state).toBe(nextState);
            expect(team.score).toBe(score - delta);
            expect(team.turn).toBe(false);
        });

        test('should properly add points on correct guess', () => {
            // Guess Correct
            loadQuestions();
            let startState = GameState.HINT;
            let nextState = GameState.GUESS;
            controller.gameStateMachine({}, {}, stubGame, startState, { player: bob });
            let team = stubGame.teams.find(team => team.id === bob.teamID);
            let score = team.score;
            let delta = stubGame.question.points;
            startState = GameState.GUESS;
            nextState = GameState.REVEAL;
            controller.gameStateMachine({}, {}, stubGame, startState, { correct: true });
            team = stubGame.teams.find(team => team.id === bob.teamID);
            expect(stubGame.state).toBe(nextState);
            expect(team.score).toBe(score + delta);
            expect(team.turn).toBe(true);
        });

        test('should properly add points on correct steal', () => {
            // Guess Correct
            loadQuestions();
            let startState = GameState.HINT;
            let nextState = GameState.GUESS;
            controller.gameStateMachine({}, {}, stubGame, startState, { player: bob });
            startState = GameState.GUESS;
            nextState = GameState.STEAL;
            controller.gameStateMachine({}, {}, stubGame, startState, { correct: false });

            startState = GameState.STEAL;
            nextState = GameState.REVEAL;
            let team = stubGame.teams.find(team => team.id === sam.teamID);
            expect(team.players.reduce((acc, player) => acc || player.turn, false)).toBe(false);
            let score = team.score;
            let delta = stubGame.question.points;
            controller.gameStateMachine({}, {}, stubGame, startState, { correct: true });
            team = stubGame.teams.find(team => team.id === sam.teamID);
            expect(stubGame.state).toBe(nextState);
            expect(team.score).toBe(score + delta);
            expect(team.turn).toBe(true);
        });

        test('should reveal answer and get next question', () => {
            loadQuestions();
            let startState = GameState.REVEAL;
            let nextState = GameState.ENTRY;
            let question = stubGame.question;
            controller.gameStateMachine({}, {}, stubGame, startState);
            expect(stubGame.teams.reduce((acc, team) => acc || team.turn, false)).toBe(false);
            expect(stubGame.state).toBe(nextState);
            expect(stubGame.question).not.toBe(question);
        });

        test('should end the game', () => {
            let startState = GameState.END;
            let nextState = GameState.SETUP;
            controller.gameStateMachine({}, {}, stubGame, startState);
            expect(stubGame.teams.reduce((acc, team) => acc || team.turn, false)).toBe(false);
            expect(stubGame.state).toBe(nextState);
            let scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
            expect(scores).toBe(0);
        });

        test('should end the game if no questions remain', () => {
            loadQuestions();
            controller.questions = [];
            controller.category = [];
            let startState = GameState.REVEAL;
            let nextState = GameState.SETUP;
            controller.gameStateMachine({}, {}, stubGame, startState);
            expect(stubGame.teams.reduce((acc, team) => acc || team.turn, false)).toBe(false);
            expect(stubGame.state).toBe(nextState);
            let scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
            expect(scores).toBe(0);
        });
    });

    test('load data', () => {
        expect(controller.questions).toHaveLength(0);
        const resp = controller.loadData({}, stubGame.id, input);
        expect(resp).toBe(true);
        expect(controller.questions).toHaveLength(70);
    });


});