import React from 'react';
import GameMenu from './GameMenu';
import { GameType } from '../../../utils/enums';

const MovieMenu = () => {
    return (
        <GameMenu title="Untitled Movie Game" gameType={GameType.MOVIE} />
    )
}

export default MovieMenu;
