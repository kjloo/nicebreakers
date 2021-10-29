import React, { useState, useEffect } from 'react';
import Button from './Button';
import { GameState } from '../../../utils/enums';
import FocusInput from './FocusInput';
import RadioGroup from './RadioGroup';
import TopFiveList from './TopFiveList';

const MAXIMUM = 5;

const TopFiveInstruction = ({ player, onNext, question, state, args }) => {
    const [list, setList] = useState(Array(MAXIMUM).fill(''));
    const [lists, setLists] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState('');
    const [category, setCategory] = useState('');
    const [selection, setSelection] = useState(null);
    const [ready, setReady] = useState(false);

    // submit team
    const submitCategory = (evt) => {
        evt.preventDefault();
        onNext({ category: category });
        setCategory('');
        setReady(true);
    }
    const submitList = (evt) => {
        evt.preventDefault();
        onNext({ list: list });
        setList(Array(MAXIMUM).fill(''));
        setReady(true);
    }
    const changeSelection = (evt) => {
        //evt.preventDefault();
        const selected = parseInt(evt.target.value);
        setSelection(selected);
        const newLists = lists.map((list, index) => {
            return { ...list, checked: (index === selected) };
        });
        setLists(newLists);
    }
    const submitSelection = (evt) => {
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

    const listIcon = (asContent = true) => {
        return lists.map(list => {
            const content = <TopFiveList list={list.data} />;
            return asContent ? content : { checked: list.checked, content: content };
        });
    }


    // for understanding
    const render = () => {
        switch (state) {
            case GameState.ENTRY:
                return ready ?
                    <h3>Please wait for other players</h3> :
                    <>
                        <h3>Submit A Top Five Category</h3>
                        <form className='option-form' onSubmit={submitCategory}>
                            <FocusInput type='text' onChange={(e) => setCategory(e.target.value)} placeholder="" value={category} required="required" />
                            <input type='submit' value='Submit' disabled={ready} />
                        </form>
                    </>;
            case GameState.HINT:
                return player.turn ?
                    <h3>Please wait</h3> :
                    ready ?
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
                        <h3>What is your Top Five {question.category}</h3>}
                    <form className="topfive-selection">
                        {player.turn ?
                            <RadioGroup onChange={changeSelection} name="select" items={listIcon(false)} /> :
                            listIcon()
                        }
                    </form>
                    {player.turn &&
                        <Button text='Submit' color="midnightblue" onClick={submitSelection} disabled={!lists.some(list => list.checked)} />}
                </div>

            case GameState.SETUP:
                return <h3>Still In Setup</h3>;
            default:
                return <h3>No Instructions</h3>;
        }
    }

    useEffect(() => {
        if (args.player) {
            setCurrentPlayer(args.player.name);
            setReady(false)
        } else if (args.lists) {
            setLists(args.lists);
        }
    }, [args])

    return (
        <div className="instruction">
            {render()}
            <Button text="End Game" color="firebrick" onClick={endGame} />
        </div>
    )
}

export default TopFiveInstruction
