import React from 'react';
import { GameType } from '../../../utils/enums';
import GameSocket from './GameSocket';
import TopFiveInstruction from './TopFiveInstruction';

const TopFiveGame = () => {
    return (
        <GameSocket title="Top Five" gameType={GameType.TOPFIVE}>
            <TopFiveInstruction />
        </GameSocket>
    )
}

export default TopFiveGame
