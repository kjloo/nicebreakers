import React, { useState, useEffect } from 'react';
import Button from './Button';
import { GameRound, GameState } from '../../../utils/enums';
import FocusInput from './FocusInput';
import RadioGroup from './RadioGroup';
import TopFiveList from './TopFiveList';

const MAXIMUM = 5;

const TopFiveInstruction = ({ player, onNext, question, state, args }) => {
    const [list, setList] = useState(Array(MAXIMUM).fill(''));
    const [lists, setLists] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState('');
    const [category, setCategory] = useState('');
    const [selection, setSelection] = useState({ name: '', data: [] });
    const [round, setRound] = useState(GameRound.RANDOM);

    const handleArgs = (extraArgs) => {
        if (extraArgs.player !== undefined) {
            setCurrentPlayer(extraArgs.player.name);
        }
        if (extraArgs.lists !== undefined) {
            setLists(extraArgs.lists);
        }
        if (extraArgs.round !== undefined) {
            setRound(extraArgs.round);
        }
        if (extraArgs.remap !== undefined) {
            if (player.name in extraArgs.remap) {
                setCurrentPlayer(extraArgs.remap[player.name]);
            }
        }
        if (extraArgs.selection !== undefined) {
            setSelection(extraArgs.selection);
        }
    }

    // submit team
    const submitCategory = (evt) => {
        evt.preventDefault();
        onNext({ category: category });
        setCategory('');
    }
    const submitList = (evt) => {
        evt.preventDefault();
        onNext({ list: list });
        setList(Array(MAXIMUM).fill(''));
    }
    const changeSelection = (evt) => {
        //evt.preventDefault();
        const choice = evt.target.value;
        const newLists = lists.map((list) => {
            return { ...list, checked: (list.key === choice) };
        });
        setLists(newLists);
        const list = newLists.find((list) => list.checked === true);
        const selected = { name: list.key, data: list.data };
        setSelection(selected);
    }
    const submitSelection = (evt) => {
        evt.preventDefault();
        onNext({ selection: selection });
    }
    const endGame = () => {
        if (confirm("Are you sure you want to end the game?")) {
            onNext({ isEnd: true });
        }
    }

    const updateList = (index, data) => {
        return list.map((item, i) => {
            if (i === index) {
                return data;
            }
            return item;
        });
    }

    const isPlayerReady = () => {
        return player.idle;
    }

    const listIcon = (asContent = true) => {
        return lists.map(list => {
            const content = <TopFiveList list={list.data} />;
            return asContent ? content : { checked: list.checked, key: list.key, data: list.data, content: content };
        });
    }

    // for understanding
    const render = () => {
        switch (state) {
            case GameState.ENTRY:
                return isPlayerReady() ?
                    <h3>Please wait for other players</h3> :
                    <>
                        <h3>Submit A Top Five Category</h3>
                        {(round === GameRound.RANDOM) ? <h4>This will be given to a random player</h4> :
                            (round === GameRound.SELF) ? <h4>This will be given to you</h4> :
                                <h4>This will be given to {currentPlayer}</h4>}
                        <form className='option-form' onSubmit={submitCategory}>
                            <FocusInput type='text' onChange={(e) => setCategory(e.target.value)} placeholder="" value={category} required="required" />
                            <input type='submit' value='Submit' disabled={isPlayerReady()} />
                        </form>
                    </>;
            case GameState.HINT:
                return player.turn ?
                    <>
                        <h3>What is your Top Five {question.category}?</h3>
                        <h4>Waiting for responses from other players</h4>
                    </> :
                    isPlayerReady() ?
                        <h3>Please wait for other players</h3> :
                        <>
                            <h3>What is {currentPlayer}'s Top Five {question.category}?</h3>
                            <form className='answer-form' onSubmit={submitList}>
                                <ol>
                                    {list.map((item, index) => {
                                        return <li>
                                            <input type='text' onChange={(e) => setList(updateList(index, e.target.value))} placeholder="" value={item} required="required" />
                                        </li>;
                                    })}
                                </ol>
                                <input type='submit' value='Submit' />
                            </form>
                        </>;
            case GameState.GUESS:
                return <div>
                    {player.turn &&
                        <h3>What is your Top Five {question.category}?</h3>}
                    <form className="topfive-selection">
                        {player.turn ?
                            <RadioGroup onChange={changeSelection} name="select" items={listIcon(false)} /> :
                            listIcon()
                        }
                    </form>
                    {player.turn &&
                        <Button text='Submit' color="midnightblue" onClick={submitSelection} disabled={!lists.some(list => list.checked)} />}
                </div>
            case GameState.REVEAL:
                return <div>
                    <h3>What is {currentPlayer}'s Top Five {question.category}?</h3>
                    <h3>{currentPlayer} selected {selection.name}</h3>
                    <div>
                        <TopFiveList list={selection.data} />
                    </div>
                    {player.turn &&
                        <Button text="Next" color="blue" onClick={onNext} />}
                </div>
            case GameState.SETUP:
                return <h3>Still In Setup</h3>;
            default:
                return <h3>No Instructions</h3>;
        }
    }

    useEffect(() => {
        handleArgs(args);
    }, [args]);

    return (
        <div className="instruction">
            {render()}
            <Button text="End Game" color="firebrick" onClick={endGame} />
        </div>
    )
}

export default TopFiveInstruction
