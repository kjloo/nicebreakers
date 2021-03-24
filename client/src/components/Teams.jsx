import React from 'react'
import Team from './Team';

const Teams = ({ player, teams, chat, onJoin, onSubmit, onDelete }) => {
    const getChatData = (team) => {
        if ((chat !== undefined) && (team.id === chat.teamID)) {
            return chat.data;
        } else {
            return [];
        }
    }
    return (
        <div className="teams-footer">
            {teams.length > 0 && teams.map((team) => {
                return <Team id={team.id} team={team} data={getChatData(team)} player={player} onJoin={onJoin} onSubmit={onSubmit} onDelete={onDelete} />
            })}
        </div>
    )
}

export default Teams