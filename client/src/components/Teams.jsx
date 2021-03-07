import React from 'react'
import Team from './Team';

const Teams = ({ player, teams, players, onJoin, onSubmit, onDelete }) => {
    return (
        <div className="teams-footer">
            {teams.length > 0 && teams.map((team) => {
                return <Team id={team.id} team={team} player={player} players={players.filter((player) => player.teamID === team.id)} onJoin={onJoin} onSubmit={onSubmit} onDelete={onDelete} />
            })}
        </div>
    )
}

export default Teams