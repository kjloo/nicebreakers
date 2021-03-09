import React, { useState } from 'react';
import enums from '../../../utils/enums.js';
import FocusInput from './FocusInput';
import Button from './Button';

const MovieInstruction = ({ player, onSubmit, onStop, state }) => {
    const [movie, setMovie] = useState('');

    // for understanding
    const render = () => {
        switch (state) {
            case enums.GameState.ENTRY:
                return player.turn ?
                    <form className='option-form' onSubmit={submitMovie}>
                        <FocusInput type='text' onChange={(e) => setMovie(e.target.value)} placeholder="Enter Movie" value={movie} required="required" />
                        <input type='submit' value='Submit' />
                    </form> :
                    <h2>Wait For Hint Giver</h2>
            case enums.GameState.HINT:
                return player.turn ?
                    <h2>Give Hints To Team</h2> :
                    <div>
                        <h2>Hit This Button When You Know The Answer!</h2>
                        <Button text="Stop" color="red" onClick={onStop} />
                    </div>
            case enums.GameState.GUESS:
                return player.turn ?
                    <h2>Players Are Guessing</h2> :
                    <h2>Make A Guess</h2>
            default:
                return <h2>No Instructions</h2>
        }
    }
    // submit team
    const submitMovie = (evt) => {
        evt.preventDefault();
        onSubmit(movie);
        setMovie('');
    }
    return (
        <div className="movie-instruction">
            {render()}
        </div>
    )
}

export default MovieInstruction
