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
    const [character, setCharacter] = useState('');
    const [contest, setContest] = useState('');
    const [opponent, setOpponent] = useState('');
    const [selection, setSelection] = useState({ name: '', data: [] });
    const [choices, setChoices] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [scored, setScored] = useState(false);

    const handleArgs = (extraArgs) => {
        if (extraArgs.player !== undefined) {
            setCurrentPlayer(extraArgs.player.name);
        }
        if (extraArgs.contest !== undefined) {
            setContest(extraArgs.contest);
        }
        if (extraArgs.opponent !== undefined) {
            setOpponent(extraArgs.opponent);
        }
        if (extraArgs.selection !== undefined) {
            setSelection(extraArgs.selection);
        }
        if (extraArgs.answers !== undefined) {
            setAnswers(extraArgs.answers);
        }
        if (extraArgs.scored !== undefined) {
            setScored(extraArgs.scored);
        }
        if (extraArgs.count !== undefined) {
            setCount(extraArgs.count);
        }
    };

    // submit team
    const submitCharacter = (evt) => {
        evt.preventDefault();
        onNext({ character: character, contest: contest });
        setCharacter('');
        setContest('');
    };
    const submitOpponent = (evt) => {
        evt.preventDefault();
        onNext({ opponent: opponent });
        setOpponent('');
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
        if (question !== null && opponent !== null && question.category !== null) {
            const choiceList = [opponent, question.category];
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
                        <h3>Submit A Character and Contest</h3>
                        <form className='option-form' onSubmit={submitCharacter}>
                            <FocusInput type='text' onChange={(e) => setCharacter(e.target.value)} placeholder="Character" value={character} required="required" />
                            <FocusInput type='text' onChange={(e) => setContest(e.target.value)} placeholder="Contest" value={contest} required="required" />
                            <input type='submit' value='Submit' disabled={isPlayerReady()} />
                        </form>
                    </>;
            case GameState.HINT:
                return player.turn ?
                    <>
                        <h3>Submit an opponent for {question.category}</h3>
                        <h3>Contest: {question.question}</h3>
                        <form className='option-form' onSubmit={submitOpponent}>
                            <FocusInput type='text' onChange={(e) => setOpponent(e.target.value)} placeholder="" value={opponent} required="required" />
                            <input type='submit' value='Submit' />
                        </form>
                    </> : <h3>Waiting for {currentPlayer}</h3>;
            case GameState.GUESS:
                return player.turn ? <>
                    <h3>{question.category} vs. {opponent}</h3>
                    <h3>Contest: {question.question}</h3>
                    <h4>Please wait for other players</h4>
                </> : isPlayerReady() ? <h3>Please wait for other players</h3> : <>
                    <h3>Choose a character: {question.category} or {opponent}</h3>
                    <h3>Contest: {question.question}</h3>
                    <form className="radio-selection">
                        <RadioGroup onChange={changeSelection} name="select" items={choices} />
                    </form>
                    <Button text='Submit' color="midnightblue" onClick={submitSelection} disabled={!choices.some(choice => choice.checked) || isPlayerReady()} />
                </>;
            case GameState.REVEAL:
                return <div>
                    <h3>{question.category} vs. {opponent}</h3>
                    <h3>Contest: {question.question}</h3>
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
    }, [question, opponent]);

    return (
        <div className="instruction">
            {render()}
            <Button text="End Game" color="firebrick" onClick={endGame} />
        </div>
    );
};

export default EqualMatchInstruction;
