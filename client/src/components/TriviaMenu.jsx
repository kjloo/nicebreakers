import React from 'react';
import GameMenu from './GameMenu';
import { GameType } from '../../../utils/enums';

const TriviaMenu = () => {
    return (
        <GameMenu title="Trivia" gameType={GameType.TRIVIA} />
    )
}

export default TriviaMenu;