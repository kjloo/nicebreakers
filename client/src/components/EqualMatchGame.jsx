import React from 'react';
import { GameType } from '../../../utils/enums';
import GameSocket from './GameSocket';
import EqualMatchInstruction from './EqualMatchInstruction';

const EqualMatchGame = () => {
    return (
        <GameSocket title="Equal Match" gameType={GameType.TOPFIVE}>
            <EqualMatchInstruction />
        </GameSocket>
    )
}

export default EqualMatchGame
