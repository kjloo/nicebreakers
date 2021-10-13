import React from 'react';
import GameSocket from './GameSocket';
import TriviaInstruction from './TriviaInstruction';
import { GameType, PlayerType } from '../../../utils/enums';

const TriviaGame = () => {
    const roles = () => {
        return [PlayerType.MASTER, PlayerType.PLAYER];
    }
    return (
        <GameSocket title="Trivia" roles={roles()} gameType={GameType.TRIVIA}>
            <TriviaInstruction />
        </GameSocket>
    )
}

export default TriviaGame;
