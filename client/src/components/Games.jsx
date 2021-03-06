import React from 'react'
import { Link } from 'react-router-dom';
import movieLogo from '../../../images/movie.svg';
import triviaLogo from '../../../images/trivia.svg';

const Games = () => {
    return (
        <div className='games-container'>
            <Link className="game-icon" to="/movie">
                <img src={movieLogo} alt="movie" />
            </Link>
            <Link className="game-icon" to="/trivia">
                <img src={triviaLogo} alt="movie" />
            </Link>
        </div>
    )
}

export default Games;
