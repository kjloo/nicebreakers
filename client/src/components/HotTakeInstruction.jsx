import React, { useState, useEffect } from 'react';
import { GameState } from '../../../utils/enums';
import FocusInput from './FocusInput';
import Button from './Button';
import DropdownGroup from './DropdownGroup';

const HotTakeInstruction = ({ player, onNext, question, state, args }) => {
    const [confession, setConfession] = useState('');
    const [selection, setSelection] = useState('');
    const [answers, setAnswers] = useState([]);
    const [results, setResults] = useState([]);
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
        if (extraArgs.results !== undefined) {
            setResults(extraArgs.results);
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
    const submitFinalSelection = (evt) => {
        evt.preventDefault();
        onNext({ answers: answers });
    };

    const validAnswers = () => {
        const rc = answers.every(answer => answer.selection);
        return rc;
    }

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
                    <div>
                        <h3>Who said</h3>
                        <h3>{question.question}</h3>
                        <form className="option-form">
                            <DropdownGroup onChange={(e) => setSelection(e.target.value)} name="select" items={players} value={selection} />
                        </form>
                        <Button text='Submit' color="midnightblue" onClick={submitSelection} disabled={!selection || isPlayerReady()} />
                    </div>;
            case GameState.GUESS:
                return isPlayerReady() ?
                    <h3>Please wait for other players</h3> :
                    <div>
                        <h3>Finalize</h3>
                        <form>
                            {answers.map((answer, index) => {
                                return <div className="label">
                                    <p>{answer.confession}</p>
                                    <DropdownGroup onChange={(e) => {
                                        setAnswers(answers.map((answer, i) => {
                                            if (index == i) {
                                                answer.selection = e.target.value;
                                            }
                                            return answer;
                                        }));
                                    }
                                    } name={answer.confession} items={players} value={answer.selection} />
                                </div>
                            })}
                        </form>
                        <Button text='Submit' color="midnightblue" onClick={submitFinalSelection} disabled={!validAnswers() || isPlayerReady()} />
                    </div>;
            case GameState.REVEAL:
                return <div>
                    {results.map((result) => {
                        return <div>
                            <p>{result.name} said {result.confession}</p>
                        </div>
                    })}
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
