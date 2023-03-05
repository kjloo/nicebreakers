import React from 'react'
import { Link } from 'react-router-dom';
import movieLogo from '../../../images/movie.svg';
import triviaLogo from '../../../images/trivia.svg';
import topFiveLogo from '../../../images/topFive.svg';
import equalMatchLogo from '../../../images/equalMatch.svg';
import hotTakeLogo from '../../../images/hotTake.svg';

const Games = () => {
    return (
        <div className='games-container'>
            <Link className="game-icon" to="/movie">
                <img src={movieLogo} alt="movie" />
            </Link>
            <Link className="game-icon" to="/trivia">
                <img src={triviaLogo} alt="trivia" />
            </Link>
            <Link className="game-icon" to="/topfive">
                <img src={topFiveLogo} alt="topfive" />
            </Link>
            <Link className="game-icon" to="/equalmatch">
                <img src={equalMatchLogo} alt="equalmatch" />
            </Link>
            <Link className="game-icon" to="/hottake">
                <img src={hotTakeLogo} alt="hottake" />
            </Link>
        </div>
    )
}

export default Games;
