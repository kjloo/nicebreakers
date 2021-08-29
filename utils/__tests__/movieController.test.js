import { MovieController } from '../movieController';
import { GameState } from '../enums';
import { stubGame } from '../__stubs__/gameStub';

jest.mock('../emitter');

let controller = new MovieController(undefined, stubGame);

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

test('increment game state', () => {
    // Init state
    expect(stubGame.answer).toBeUndefined();
    expect(stubGame.cachedPlayers).toEqual([]);
    // check sum of scores is 0
    let scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(0);

    // Start game
    let startState = GameState.SETUP;
    let nextState = GameState.ENTRY;
    controller.gameStateMachine({}, stubGame, startState, {});
    expect(stubGame.state).toBe(nextState);

    // Hint
    startState = GameState.ENTRY;
    nextState = GameState.HINT;
    const answer = "Cats";
    controller.gameStateMachine({}, stubGame, startState, { answer: answer });
    expect(stubGame.state).toBe(nextState);
    // Check answer
    expect(stubGame.question.answer).toBe(answer);

    // Steal
    startState = GameState.HINT;
    nextState = GameState.STEAL;
    controller.gameStateMachine({}, stubGame, startState, {});
    expect(stubGame.state).toBe(nextState);

    // Guess
    startState = GameState.STEAL;
    nextState = GameState.GUESS;
    controller.gameStateMachine({}, stubGame, startState, { correct: false });
    expect(stubGame.state).toBe(nextState);

    // check sum of scores is 0
    scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(0);

    // Reveal
    startState = GameState.STEAL;
    nextState = GameState.REVEAL;
    controller.gameStateMachine({}, stubGame, startState, { correct: true });
    expect(stubGame.state).toBe(nextState);

    // check sum of scores is 1
    scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(1);

    startState = GameState.GUESS;
    nextState = GameState.REVEAL;
    controller.gameStateMachine({}, stubGame, startState, { correct: true });
    expect(stubGame.state).toBe(nextState);

    // check sum of scores is 2
    scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(2);

    startState = GameState.GUESS;
    nextState = GameState.REVEAL;
    controller.gameStateMachine({}, stubGame, startState, { correct: false });
    expect(stubGame.state).toBe(nextState);

    // check sum of scores is 2
    scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(2);

    // ENTRY
    startState = GameState.REVEAL;
    nextState = GameState.ENTRY;
    controller.gameStateMachine({}, stubGame, startState, {});
    expect(stubGame.state).toBe(nextState);

    // END
    startState = GameState.END;
    nextState = GameState.SETUP;
    controller.gameStateMachine({}, stubGame, startState, {});
    expect(stubGame.state).toBe(nextState);
    // check no cached players
    expect(stubGame.cachedPlayers).toEqual([]);
    // check sum of scores is 0
    scores = stubGame.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(0);
    // check no turn set
    let turn = stubGame.teams.reduce((acc, cur) => acc || cur.turn, false);
    expect(turn).toBe(false);
});