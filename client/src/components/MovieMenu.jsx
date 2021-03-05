import React, { useState } from 'react'
import GameMenu from './GameMenu';
import Button from './Button';

const MovieMenu = () => {
    const codeLength = 4;
    const [code, setCode] = useState('');

    // validate key press
    const validateKeyPress = (evt) => {
        // return true if it is a letter
        const re = /[a-zA-Z]/;
        if (!re.test(evt.key)) {
            evt.preventDefault();
        }
    }

    return (
        <GameMenu title="Untitled Movie Game">
            <div className='form-input'>
                <p className='label'>Enter Room Code: </p>
                <input type='text' value={code} maxLength={codeLength} onKeyPress={validateKeyPress} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            </div>
            <a href='/movie/game'>
                <Button text="Create Game" color="lightskyblue" />
            </a>
            <a href={`/movie/game/${code}`}>
                <Button text="Join Game" color="green" disabled={code.length < codeLength} />
            </a>
        </GameMenu >
    )
}

export default MovieMenu;
