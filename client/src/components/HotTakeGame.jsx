import React from 'react';
import { GameType, PlayerType } from '../../../utils/enums';
import GameSocket from './GameSocket';
import HotTakeInstruction from './HotTakeInstruction';

const HotTakeGame = () => {
    const roles = () => {
        return [PlayerType.MASTER, PlayerType.PLAYER];
    }
    return (
        <GameSocket title="Hot Take" roles={roles()} gameType={GameType.HOTTAKE}>
            <HotTakeInstruction />
        </GameSocket>
    )
}

export default HotTakeGame
