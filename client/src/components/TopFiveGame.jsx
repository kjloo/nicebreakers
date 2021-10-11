import React from 'react';
import GameSocket from './GameSocket';
import TopFiveInstruction from './TopFiveInstruction';

const TopFiveGame = () => {
    return (
        <GameSocket title="Top Five">
            <TopFiveInstruction />
        </GameSocket>
    )
}

export default TopFiveGame
