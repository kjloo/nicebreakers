import React, { useState } from 'react';
import FocusInput from './FocusInput';

const MovieInstruction = ({ player, onSubmit, isReady }) => {
    const [movie, setMovie] = useState('');

    // submit team
    const submitMovie = (evt) => {
        evt.preventDefault();
        onSubmit(movie);
        setMovie('');
    }
    return (
        <>
            {player.turn ?
                <form className='option-form' onSubmit={submitMovie}>
                    <FocusInput type='text' onChange={(e) => setMovie(e.target.value)} placeholder="Enter Movie" value={movie} required="required" />
                    <input type='submit' value='Submit' />
                </form> : !isReady ? <h2>Wait</h2> : <h2>Guess</h2>}
        </>
    )
}

export default MovieInstruction
