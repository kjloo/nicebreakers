import React from 'react';
import GameMenu from './GameMenu';
import { GameType } from '../../../utils/enums';

const HotTakeMenu = () => {
    return (
        <GameMenu title="Hot Take" gameType={GameType.HOTTAKE} />
    )
}

export default HotTakeMenu;
