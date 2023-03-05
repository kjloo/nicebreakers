import React from 'react';
import { GameType } from '../../../utils/enums';
import GameSocket from './GameSocket';
import HotTakeInstruction from './HotTakeInstruction';

const HotTakeGame = () => {
    return (
        <GameSocket title="Hot Take" gameType={GameType.HOTTAKE}>
            <HotTakeInstruction />
        </GameSocket>
    )
}

export default HotTakeGame
