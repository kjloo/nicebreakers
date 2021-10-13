import React from 'react';
import GameMenu from './GameMenu';
import { GameType } from '../../../utils/enums';

const TopFiveMenu = () => {
    return (
        <GameMenu title="Top Five" gameType={GameType.TOPFIVE} />
    )
}

export default TopFiveMenu;
