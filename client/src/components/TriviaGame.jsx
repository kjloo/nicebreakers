import React from 'react';
import GameSocket from './GameSocket';
import TriviaInstruction from './TriviaInstruction';

const TriviaGame = () => {
    return (
        <GameSocket title="Trivia">
            <TriviaInstruction />
        </GameSocket>
    )
}

export default TriviaGame;
