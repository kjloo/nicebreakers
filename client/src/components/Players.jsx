import React from 'react'

const Players = ({ players }) => {
    return (
        <div className='players-container'>
            <h4>Players</h4>
            {players.map((player) => {
                return <p>{player.name}</p>
            })}
        </div>
    )
}

Players.defaultProps = {
    players: []
}

export default Players;