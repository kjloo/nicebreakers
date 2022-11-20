import React, { useState, useEffect } from 'react';
import Button from './Button';
import { GameState } from '../../../utils/enums';
import FocusInput from './FocusInput';
import RadioGroup from './RadioGroup';
import DefaultRadioChoice from './DefaultRadioChoice';
import Table from 'react-bootstrap/Table';
import ColoredText from './ColoredText';

const DEFAULT_BLANK = "______";

const EqualMatchInstruction = ({ player, onNext, question, state, args }) => {
    const [currentPlayer, setCurrentPlayer] = useState('');
    const [count, setCount] = useState(2);
    const [character, setCharacter] = useState('');
    const [situation, setSituation] = useState('');
    const [selection, setSelection] = useState({ name: '', data: [] });
    const [choices, setChoices] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [scored, setScored] = useState(false);

    const handleArgs = (extraArgs) => {
        if (extraArgs.player !== undefined) {
            setCurrentPlayer(extraArgs.player.name);
        }
        if (extraArgs.situation !== undefined) {
            setSituation(extraArgs.situation);
        }
        if (extraArgs.selection !== undefined) {
            setSelection(extraArgs.selection);
        }
        if (extraArgs.answers !== undefined) {
            console.log("HERE");
            setAnswers(extraArgs.answers);
        }
        if (extraArgs.scored !== undefined) {
            console.log("THERE");
            setScored(extraArgs.scored);
        }
        if (extraArgs.count !== undefined) {
            setCount(extraArgs.count);
        }
    };

    // submit team
    const submitCharacter = (evt) => {
        evt.preventDefault();
        onNext({ character: character });
        setCharacter('');
    };
    const submitSituation = (evt) => {
        evt.preventDefault();
        onNext({ situation: situation });
        setSituation('');
    };
    const changeSelection = (evt) => {
        //evt.preventDefault();
        const choice = evt.target.value;
        const newChoices = choices.map((c) => {
            return { ...c, checked: (c.key === choice) };
        });
        setChoices(newChoices);
        const newChoice = newChoices.find((choice) => choice.checked === true);
        const selected = { name: newChoice.key, data: newChoice.data };
        setSelection(selected);
    };
    const submitSelection = (evt) => {
        evt.preventDefault();
        onNext({ selection: selection });
    };
    const endGame = () => {
        if (confirm("Are you sure you want to end the game?")) {
            onNext({ isEnd: true });
        }
    };

    const isPlayerReady = () => {
        return player.idle;
    };

    const createChoices = () => {
        if (question !== null && question.question !== null && question.category !== null) {
            const choiceList = [question.question, question.category];
            setChoices(choiceList.map((choice) => {
                const content = <DefaultRadioChoice item={choice} />;
                return { checked: false, key: choice, data: [choice], content: content };
            }));
        }
    };

    const voteTable = () => {
        return <Table className="answer-table">
            <thead>
                <tr>
                    <th>Answer</th>
                    <th>Votes</th>
                </tr>
            </thead>
            <tbody>
                {answers.map((row) => {
                    return <tr>
                        <td>{row["name"]}</td>
                        <td>{row["value"]}</td>
                    </tr>;
                })}
            </tbody>
        </Table>;
    };

    // for understanding
    const render = () => {
        switch (state) {
            case GameState.ENTRY:
                return isPlayerReady() ?
                    <h3>Please wait for other players</h3> :
                    <>
                        <h3>Submit A Character ({count})</h3>
                        <form className='option-form' onSubmit={submitCharacter}>
                            <FocusInput type='text' onChange={(e) => setCharacter(e.target.value)} placeholder="" value={character} required="required" />
                            <input type='submit' value='Submit' disabled={isPlayerReady()} />
                        </form>
                    </>;
            case GameState.HINT:
                return player.turn ?
                    <>
                        <h3>Who would win in a {situation.length ? situation : DEFAULT_BLANK}: {question.question} or {question.category}?</h3>
                        <form className='option-form' onSubmit={submitSituation}>
                            <FocusInput type='text' onChange={(e) => setSituation(e.target.value)} placeholder="" value={situation} required="required" />
                            <input type='submit' value='Submit' />
                        </form>
                    </> : <h3>Waiting for {currentPlayer}</h3>;
            case GameState.GUESS:
                return player.turn ? <>
                    <h3>Who would win in a {situation}: {question.question} or {question.category}?</h3>
                    <h4>Please wait for other players</h4>
                </> : isPlayerReady() ? <h3>Please wait for other players</h3> : <>
                    <h3>Who would win in a {situation}?</h3>
                    <form className="radio-selection">
                        <RadioGroup onChange={changeSelection} name="select" items={choices} />
                    </form>
                    <Button text='Submit' color="midnightblue" onClick={submitSelection} disabled={!choices.some(choice => choice.checked) || isPlayerReady()} />
                </>;
            case GameState.REVEAL:
                return <div>
                    <h3>Who would win in a {situation}: {question.question} or {question.category}?</h3>
                    {voteTable()}
                    <h4>Scored: {scored ? <ColoredText text="Success" color="green" /> : <ColoredText text="Failed" color="red" />}</h4>
                    {player.turn &&
                        <Button text="Next" color="blue" onClick={onNext} />}
                </div>;
            case GameState.SETUP:
                return <h3>Still In Setup</h3>;
            default:
                return <h3>No Instructions</h3>;
        }
    };

    useEffect(() => {
        handleArgs(args);
    }, [args]);

    useEffect(() => {
        createChoices();
    }, [question]);

    return (
        <div className="instruction">
            {render()}
            <Button text="End Game" color="firebrick" onClick={endGame} />
        </div>
    );
};

export default EqualMatchInstruction;
