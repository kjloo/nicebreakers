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
    const createTeamsFooter = () => {
        if (teams.length > 0) {
            return teams.map((team) => {
                return <Team team={team} data={getChatData(team)} player={player} onJoin={onJoin} onSubmit={onSubmit} onDelete={onDelete} />
            });
        }
    }
    return (
        <div className="teams-footer">
            {createTeamsFooter()}
        </div>
    )
}

export default Teams