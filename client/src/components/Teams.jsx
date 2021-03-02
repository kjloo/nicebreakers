import React from 'react'
import Team from './Team';

const Teams = ({ teams, onSubmit, onDelete }) => {
    return (
        <div className="teams-footer">
            {teams.length > 0 && teams.map((team) => {
                return <Team id={team.id} team={team} onSubmit={onSubmit} onDelete={onDelete} />
            })}
        </div>
    )
}

export default Teams