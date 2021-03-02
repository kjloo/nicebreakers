import React from 'react'

const Players = ({ players, title }) => {
    return (
        <div className='players-container'>
            <h4>{title}</h4>
            {players.map((player) => {
                return <p id={player.id}>{player.name}</p>
            })}
        </div>
    )
}

Players.defaultProps = {
    players: [],
    title: "Players"
}

export default Players;