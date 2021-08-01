import logger from './logger';
import { GameState } from './enums';
import { GameController } from './gameController';
const emitter = require('./emitter');

export class TriviaController extends GameController {

    public override gameStateMachine(s, game, state, args): void {
        switch (state) {
            case GameState.SETUP:
                emitter.updateState(s, game, GameState.ENTRY);
                break;
        }
    }
};