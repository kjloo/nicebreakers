import React from 'react';
import { useState, useEffect } from 'react';
import { GameState, PlayerType } from '../../../utils/enums';
import Button from './Button';
import AnswerValidator from './AnswerValidator'

const TriviaInstruction = ({ player, teams, onNext, state, question }) => {
    const [team, setTeam] = useState(undefined);
    const endGame = () => {
        if (confirm("Are you sure you want to end the game?")) {
            onNext({ isEnd: true });
        }
    }

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

    // for understanding
    const render = () => {
        if (!player) {
            return;
        }
        // Player not in current game
        if (player.type !== PlayerType.MASTER && player.teamID === -1) {
            return <h3>Wait For Current Game To End</h3>
        }
        switch (state) {
            case GameState.ENTRY:
                return (player.type === PlayerType.MASTER) ?
                    <div>
                        <h3>Category: {question.category}</h3>
                        <p className='question'>{question.question}</p>
                        <Button text="Done" color="lightgreen" onClick={onNext} />
                    </div> :
                    <h3>Listen To Question</h3>
            case GameState.HINT:
                return <div>
                    <h3>Category: {question.category}</h3>
                    <p className='question'>{question.question}</p>
                    {(player.type !== PlayerType.MASTER) ?
                        <Button text="Buzz" color="red" onClick={() => onNext({ player: player })} /> :
                        <Button text="Skip" color="red" onClick={() => onNext({})} />}
                </div>
            case GameState.STEAL:
            case GameState.GUESS:
                return (player.type === PlayerType.MASTER) ?
                    <>
                        <h3 style={{ color: getCurrentTeam().color }}>Team {getCurrentTeam().name} Is Guessing</h3>
                        <h4>Answer: {question.answer}</h4>
                        <AnswerValidator onAnswer={onNext} />
                    </> :
                    isTeamsTurn() ?
                        <h3>Answer Question</h3> :
                        <h3>Opponents Are Guessing</h3>
            case GameState.REVEAL:
                return <div>
                    <h3>The Answer Is: {question.answer}</h3>
                    {player.type === PlayerType.MASTER &&
                        <Button text="Next" color="blue" onClick={onNext} />}
                </div>
            case GameState.SETUP:
                return <h3>Still In Setup</h3>
            default:
                return <h3>No Instructions</h3>
        }
    }

    useEffect(() => {
        setTeam(getCurrentTeam());
    }, [teams])

    return (
        <div className="instructions">
            {render()}
            {player.type === PlayerType.MASTER &&
                <Button text="End Game" color="firebrick" onClick={endGame} />}
        </div>
    )
}

export default TriviaInstruction
