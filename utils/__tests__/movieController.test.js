import { MovieController } from '../movieController';
import { GameState } from '../enums';
import { game } from '../__stubs__/gameStub';

jest.mock('../emitter');

let controller = new MovieController(game);

beforeEach(() => {
    controller.resetGameState(undefined, game);
});

test('check current player', () => {
    let teamIndex = 0;
    let playerIndex = 0;
    // Player should be first player on first team
    expect(controller.getCurrentPlayer(game)).toEqual(game.teams[teamIndex].players[playerIndex]);
    // Move to next player
    controller.incrementPlayerIndex(game);
    playerIndex = 1;
    // Player should be sean
    expect(controller.getCurrentPlayer(game)).toEqual(game.teams[teamIndex].players[playerIndex]);
    // Move to next player
    controller.incrementPlayerIndex(game);
    // Should wrap back around. Player should be bob
    playerIndex = 0;
    expect(controller.getCurrentPlayer(game)).toEqual(game.teams[teamIndex].players[playerIndex]);

    // Excercise player turn change
    controller.changePlayerTurns(game);
    teamIndex = 1;
    expect(controller.getCurrentPlayer(game)).toEqual(game.teams[teamIndex].players[playerIndex]);
    expect(game.teams[0].players[0].turn).toBe(false);
    expect(game.teams[teamIndex].players[playerIndex].turn).toBe(true);
    expect(controller.getCurrentTeam(game)).toEqual(game.teams[teamIndex]);

    // Exercise increment game state
    controller.incrementGameState(undefined, game);
    teamIndex = 0;
    playerIndex = 1;
    expect(controller.getCurrentPlayer(game)).toEqual(game.teams[teamIndex].players[playerIndex]);
    expect(game.teams[1].players[0].turn).toBe(false);
    expect(game.teams[teamIndex].players[playerIndex].turn).toBe(true);
    expect(controller.getCurrentTeam(game)).toEqual(game.teams[teamIndex]);
});

test('check current team', () => {
    let teamIndex = 0;
    // Team should be fish
    expect(controller.getCurrentTeam(game)).toEqual(game.teams[teamIndex]);
    // Move to next team
    controller.incrementTeamIndex(game);
    teamIndex = 1;
    // Team should be cat
    expect(controller.getCurrentTeam(game)).toEqual(game.teams[teamIndex]);
    // Move to next team
    controller.incrementTeamIndex(game);
    teamIndex = 0;
    // Should wrap back around. Team should be fish
    expect(controller.getCurrentTeam(game)).toEqual(game.teams[teamIndex]);

    // Use change team turns
    controller.changeTeamTurns(game);
    teamIndex = 1;
    // Team should be cat
    expect(controller.getCurrentTeam(game)).toEqual(game.teams[teamIndex]);
    expect(game.teams[teamIndex].turn).toBe(true);
    expect(game.teams[0].turn).toBe(false);
});

test('increment game state', () => {
    // Init state
    expect(game.answer).toBe("");
    expect(game.cachedPlayers).toEqual([]);
    // check sum of scores is 0
    let scores = game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(0);

    // Start game
    let startState = GameState.SETUP;
    let nextState = GameState.ENTRY;
    controller.gameStateMachine({}, game, startState, {});
    expect(game.state).toBe(nextState);

    // Hint
    startState = GameState.ENTRY;
    nextState = GameState.HINT;
    const answer = "Cats";
    controller.gameStateMachine({}, game, startState, { answer: answer });
    expect(game.state).toBe(nextState);
    // Check answer
    expect(game.answer).toBe(answer);

    // Steal
    startState = GameState.HINT;
    nextState = GameState.STEAL;
    controller.gameStateMachine({}, game, startState, {});
    expect(game.state).toBe(nextState);

    // Guess
    startState = GameState.STEAL;
    nextState = GameState.GUESS;
    controller.gameStateMachine({}, game, startState, { correct: false });
    expect(game.state).toBe(nextState);

    // check sum of scores is 0
    scores = game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(0);

    // Reveal
    startState = GameState.STEAL;
    nextState = GameState.REVEAL;
    controller.gameStateMachine({}, game, startState, { correct: true });
    expect(game.state).toBe(nextState);

    // check sum of scores is 1
    scores = game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(1);

    startState = GameState.GUESS;
    nextState = GameState.REVEAL;
    controller.gameStateMachine({}, game, startState, { correct: true });
    expect(game.state).toBe(nextState);

    // check sum of scores is 2
    scores = game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(2);

    startState = GameState.GUESS;
    nextState = GameState.REVEAL;
    controller.gameStateMachine({}, game, startState, { correct: false });
    expect(game.state).toBe(nextState);

    // check sum of scores is 2
    scores = game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(2);

    // ENTRY
    startState = GameState.REVEAL;
    nextState = GameState.ENTRY;
    controller.gameStateMachine({}, game, startState, {});
    expect(game.state).toBe(nextState);

    // END
    startState = GameState.END;
    nextState = GameState.SETUP;
    controller.gameStateMachine({}, game, startState, {});
    expect(game.state).toBe(nextState);
    // check no cached players
    expect(game.cachedPlayers).toEqual([]);
    // check sum of scores is 0
    scores = game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(0);
    // check no turn set
    let turn = game.teams.reduce((acc, cur) => acc || cur.turn, false);
    expect(turn).toBe(false);
});