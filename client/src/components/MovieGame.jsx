import React from 'react';
import GameSocket from './GameSocket';
import MovieInstruction from './MovieInstruction';

const MovieGame = () => {
    return (
        <GameSocket title="Untitled Movie Game">
            <MovieInstruction />
        </GameSocket>
    )
}

export default MovieGame
