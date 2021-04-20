import React from 'react'

const Players = ({ players, title }) => {
    const createPlayersList = () => {
        if (!(players instanceof Array)) {
            return <></>;
        }
        return players.map((player) => {
            return <li id={player.id}>{player.name}</li>
        });
    }
    return (
        <div className='players-container'>
            <h4>{title}</h4>
            <ul className='players-list'>
                {createPlayersList()}
            </ul>
        </div>
    )
}

Players.defaultProps = {
    players: [],
    title: "Players"
}

export default Players;