import React from 'react';
import { GameType } from '../../../utils/enums';
import GameSocket from './GameSocket';
import MovieInstruction from './MovieInstruction';

const MovieGame = () => {
    return (
        <GameSocket title="Untitled Movie Game" gameType={GameType.MOVIE}>
            <MovieInstruction />
        </GameSocket>
    )
}

export default MovieGame
