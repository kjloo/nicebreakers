import React, { useState, useEffect } from 'react';
import enums from '../../../utils/enums';
import FocusInput from './FocusInput';
import Button from './Button';
import AnswerValidator from './AnswerValidator';

const MovieInstruction = ({ player, teams, onNext, state, answer }) => {
    const [movie, setMovie] = useState('');
    const [team, setTeam] = useState(undefined);

    const getCurrentTeam = () => {
        // Get which teams turn it is
        return teams.find((team) => team.turn);
    }

    const displayTeam = () => {
        if (team !== undefined) {
            return <h2 style={{ color: team.color }}> Team {team.name}'s Turn</h2>
        }
    }

    // for understanding
    const render = () => {
        switch (state) {
            case enums.GameState.ENTRY:
                return player.turn ?
                    <form className='option-form' onSubmit={submitMovie}>
                        <FocusInput type='text' onChange={(e) => setMovie(e.target.value)} placeholder="Enter Movie" value={movie} required="required" />
                        <input type='submit' value='Submit' />
                    </form> :
                    <h3>Wait For Hint Giver</h3>
            case enums.GameState.HINT:
                return player.turn ?
                    <h3>Give Hints To Team</h3> :
                    <div>
                        <h3>Listen to Hints</h3>
                        {player.teamID === team.id &&
                            <>
                                <h3>Hit This Button When You Know The Answer!</h3>
                                <Button text="Stop" color="red" onClick={onNext} />
                            </>
                        }
                    </div >
            case enums.GameState.STEAL:
                return player.turn ?
                    <>
                        <h3>Opposing Team Players Are Guessing</h3>
                        <AnswerValidator onAnswer={onNext} />
                    </> :
                    player.teamID === team.id ?
                        <h3>Wait. Opponents Are Guessing</h3> :
                        <h3>Try To Steal</h3>
            case enums.GameState.GUESS:
                return player.turn ?
                    <>
                        <h3>Players Are Guessing</h3>
                        <AnswerValidator onAnswer={onNext} />
                    </> :
                    player.teamID === team.id ?
                        <h3>Make A Guess</h3> :
                        <h3>Wait. Opponents Are Guessing</h3>
            case enums.GameState.REVEAL:
                return <>
                    <h3>The Answer Is: {answer}</h3>
                    <Button text="Next" color="blue" onClick={onNext} />
                </>
            default:
                return <h3>No Instructions</h3>
        }
    }
    // submit team
    const submitMovie = (evt) => {
        evt.preventDefault();
        onNext(movie);
        setMovie('');
    }

    useEffect(() => {
        setTeam(getCurrentTeam());
    }, [teams])

    return (
        <div className="movie-instruction">
            {displayTeam()}
            {render()}
        </div>
    )
}

export default MovieInstruction
