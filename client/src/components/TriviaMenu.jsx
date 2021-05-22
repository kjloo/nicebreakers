import React, { useState, useRef } from 'react'
import GameMenu from './GameMenu';
import Button from './Button';
import FocusInput from './FocusInput';

const TriviaMenu = () => {
    const codeLength = 4;
    const [create, setCreate] = useState(false);
    const [join, setJoin] = useState(false);
    const [player, setPlayer] = useState('');
    const [code, setCode] = useState('');

    const codeRef = useRef(null);
    const playerRef = useRef(null);
    // validate key press
    const validateKeyPress = (evt) => {
        // return true if it is a letter
        const re = /[a-zA-Z]/;
        if (!re.test(evt.key)) {
            evt.preventDefault();
            return false;
        }
        return true;
    }

    const handleSubmitCode = (evt) => {
        if (evt.key == 'Enter') {
            codeRef.current.click();
        }
    }

    const handleSubmitPlayer = (evt) => {
        if (evt.key == 'Enter') {
            playerRef.current.click();
        }
    }

    return (
        <GameMenu title="Trivia">
            {!create && !join &&
                <>
                    <Button text="Create Game" color="lightskyblue" onClick={() => setCreate(true)} />
                    <Button text="Join Game" color="green" onClick={() => setJoin(true)} />
                </>
            }
            {join &&
                <div onKeyPress={handleSubmitCode}>
                    <div>
                        <FocusInput type='text' value={code} placeholder="Enter Room Code" length={codeLength} onKeyPress={validateKeyPress} onChange={(e) => setCode(e.target.value.toUpperCase())} />
                    </div>
                    <a ref={codeRef} href={`/movie/game/${code}`}>
                        <Button text="Join Game" color="green" disabled={code.length < codeLength} />
                    </a>
                </div>
            }
            {create &&
                <div onKeyPress={handleSubmitPlayer}>
                    <div>
                        <FocusInput type='text' value={player} placeholder="Enter Name" onChange={(e) => setPlayer(e.target.value)} />
                    </div>

                    <a ref={playerRef} href={`/movie/game/?player=${player}`}>
                        <Button text="Create Game" color="lightskyblue" disabled={player.length === 0} />
                    </a>
                </div>
            }
        </GameMenu >
    )
}

export default TriviaMenu;
