import React from 'react'

const Players = ({ players, title }) => {
    return (
        <div className='players-container'>
            <h4>{title}</h4>
            <ul className='players-list'>
                {players.map((player) => {
                    return <li id={player.id}>{player.name}</li>
                })}
            </ul>
        </div>
    )
}

Players.defaultProps = {
    players: [],
    title: "Players"
}

export default Players;