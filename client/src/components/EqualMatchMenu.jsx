import React from 'react';
import GameMenu from './GameMenu';
import { GameType } from '../../../utils/enums';

const EqualMatchMenu = () => {
    return (
        <GameMenu title="Equal Match" gameType={GameType.EQUALMATCH} />
    )
}

export default EqualMatchMenu;
