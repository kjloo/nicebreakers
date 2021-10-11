import React, { useState, useEffect } from 'react';
import { GameState } from '../../../utils/enums';
import FocusInput from './FocusInput';
import Button from './Button';
import AnswerValidator from './AnswerValidator';

const TopFiveInstruction = ({ player, teams, onNext, state, question }) => {
    const [movie, setMovie] = useState('');
    const [team, setTeam] = useState(undefined);

    const getCurrentTeam = () => {
        if (!Array.isArray(teams)) {
            return undefined;
        }
        // Get which teams turn it is
        return teams.find((team) => team.turn);
    }

    const isTeamsTurn = () => {
        let currentTeam = team;
        if (currentTeam === undefined) {
            currentTeam = getCurrentTeam();
            if (currentTeam === undefined) {
                return false;
            }
            setTeam(currentTeam);
        }
        return (player && (player.teamID === currentTeam.id));
    }

    const displayTeam = () => {
        if ((team !== undefined) && (state !== GameState.REVEAL)) {
            return <h2 style={{ color: team.color }}> Team {team.name}'s Turn</h2>
        }
    }

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
                    <h3>Wait For Hint Giver</h3>
            case GameState.HINT:
                return player.turn ?
                    <h3>Give Hints To Team</h3> :
                    <div>
                        <h3>Listen to Hints</h3>
                        {isTeamsTurn() &&
                            <>
                                <h3>Hit This Button When You Know The Answer!</h3>
                                <Button text="Stop" color="red" onClick={onNext} />
                            </>
                        }
                    </div >
            case GameState.STEAL:
                return player.turn ?
                    <>
                        <h3>Opposing Team Players Are Guessing</h3>
                        <AnswerValidator onAnswer={onNext} />
                    </> :
                    isTeamsTurn() ?
                        <h3>Wait. Opponents Are Guessing</h3> :
                        <h3>Try To Steal</h3>
            case GameState.GUESS:
                return player.turn ?
                    <>
                        <h3>Players Are Guessing</h3>
                        <AnswerValidator onAnswer={onNext} />
                    </> :
                    isTeamsTurn() ?
                        <h3>Make A Guess</h3> :
                        <h3>Wait. Opponents Are Guessing</h3>
            case GameState.REVEAL:
                return <div>
                    <h3>The Answer Is: {question.answer}</h3>
                    <Button text="Next" color="blue" onClick={onNext} />
                </div>
            case GameState.SETUP:
                return <h3>Still In Setup</h3>
            default:
                return <h3>No Instructions</h3>
        }
    }
    // submit team
    const submitMovie = (evt) => {
        evt.preventDefault();
        onNext({ answer: movie });
        setMovie('');
    }

    useEffect(() => {
        setTeam(getCurrentTeam());
    }, [teams])

    return (
        <div className="instruction">
            {displayTeam()}
            {render()}
            <Button text="End Game" color="firebrick" onClick={endGame} />
        </div>
    )
}

export default TopFiveInstruction
