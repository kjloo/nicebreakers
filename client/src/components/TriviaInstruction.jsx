import React from 'react';
import { GameState } from '../../../utils/enums';
import FocusInput from './FocusInput';
import Button from './Button';

const TriviaInstruction = ({ player, teams, onNext, state, answer }) => {

    const endGame = () => {
        if (confirm("Are you sure you want to end the game?")) {
            onNext({ isEnd: true });
        }
    }

    // for understanding
    const render = () => {
        if (player && (player.teamID === -1)) {
            return <h3>Wait For Current Game To End</h3>
        }
        switch (state) {
            case GameState.ENTRY:
                return player.turn ?
                    <form className='option-form' onSubmit={submitMovie}>
                        <FocusInput type='text' onChange={(e) => setMovie(e.target.value)} placeholder="Enter Movie" value={movie} required="required" />
                        <input type='submit' value='Submit' />
                    </form> :
                    <h3>Listen to Question</h3>
            case GameState.SETUP:
                return <h3>Still In Setup</h3>
            default:
                return <h3>No Instructions</h3>
        }
    }

    return (
        <div className="instructions">
            {render()}
            <Button text="End Game" color="firebrick" onClick={endGame} />
        </div>
    )
}

export default TriviaInstruction
