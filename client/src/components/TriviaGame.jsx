import React from 'react';
import GameSocket from './GameSocket';
import TriviaInstruction from './TriviaInstruction';
import { PlayerType } from '../../../utils/enums';

const TriviaGame = () => {
    const roles = () => {
        return [PlayerType.MASTER, PlayerType.PLAYER];
    }
    return (
        <GameSocket title="Trivia" roles={roles()}>
            <TriviaInstruction />
        </GameSocket>
    )
}

export default TriviaGame;
