import React, { useState, useEffect } from 'react';
import { GameState } from '../../../utils/enums';
import FocusInput from './FocusInput';
import Button from './Button';
import DropdownGroup from './DropdownGroup';

const HotTakeInstruction = ({ player, onNext, question, state, args }) => {
    const [confession, setConfession] = useState('');
    const [selection, setSelection] = useState('');
    const [answers, setAnswers] = useState([]);
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        handleArgs(args);
    }, [args]);

    const isPlayerReady = () => {
        return player.idle;
    };

    const endGame = () => {
        if (confirm("Are you sure you want to end the game?")) {
            onNext({ isEnd: true });
        }
    }

    const handleArgs = (extraArgs) => {
        if (extraArgs.players !== undefined) {
            setPlayers(extraArgs.players);
        }
        if (extraArgs.answers !== undefined) {
            setAnswers(extraArgs.answers);
        }
    }

    const submitConfession = (evt) => {
        evt.preventDefault();
        onNext({ confession: confession });
        setConfession('');
    };
    const submitSelection = (evt) => {
        evt.preventDefault();
        onNext({ selection: selection });
    };

    // for understanding
    const render = () => {
        switch (state) {
            case GameState.ENTRY:
                return isPlayerReady() ?
                    <h3>Please wait for other players</h3> :
                    <>
                        <h3>Submit A Hot Take</h3>
                        <form className='option-form' onSubmit={submitConfession}>
                            <FocusInput type='text' onChange={(e) => setConfession(e.target.value)} placeholder="Statement" value={confession} required="required" />
                            <input type='submit' value='Submit' disabled={isPlayerReady()} />
                        </form>
                    </>;
            case GameState.HINT:
                return isPlayerReady() ?
                    <h3>Please wait for other players</h3> :
                    <>
                        <h3>Who said</h3>
                        <h3>{question.question}</h3>
                        <form className="radio-selection">
                            <DropdownGroup onChange={(e) => setSelection(e.target.value)} name="select" items={players} value={selection} />
                        </form>
                        <Button text='Submit' color="midnightblue" onClick={submitSelection} disabled={!selection || isPlayerReady()} />
                    </>;
            case GameState.GUESS:
                return isPlayerReady() ?
                    <h3>Please wait for other players</h3> :
                    <>
                        <h3>Finalize</h3>
                        {answers.map(answer => { return <><div>{answer.confession}:{answer.name}</div></> })}
                    </>;
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

    return (
        <div className="instruction">
            {render()}
            <Button text="End Game" color="firebrick" onClick={endGame} />
        </div>
    )
}

export default HotTakeInstruction
