import React from 'react'
import { Link } from 'react-router-dom';
import GameMenu from './GameMenu';
import Button from './Button';

const MovieMenu = () => {
    return (
        <GameMenu title="Untitled Movie Game">
            <Link to="/movie/1">
                <Button text="Create Game" color="silver" />
            </Link>
            <Link to="/movie/1">
                <Button text="Join Game" color="silver" />
            </Link>
        </GameMenu>
    )
}

export default MovieMenu;
