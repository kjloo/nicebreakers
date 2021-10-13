import React, { useState, useEffect } from 'react';
import Button from './Button';

const TopFiveInstruction = ({ player, onNext, state }) => {
    const [movie, setMovie] = useState('');

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
            default:
                return <h3>No Instructions</h3>
        }
    }

    useEffect(() => {
    }, [])

    return (
        <div className="instruction">
            {render()}
            <Button text="End Game" color="firebrick" onClick={endGame} />
        </div>
    )
}

export default TopFiveInstruction
