import React, { useState, useEffect } from 'react'
import Chat from './Chat';
import Banner from './Banner';
import Players from './Players';

const Team = ({ player, team, data, onJoin, onSubmit, onDelete }) => {
    const [minimize, setMinimize] = useState(true);

    // handle click
    const bannerClick = () => {
        if (onJoin(team)) {
            setMinimize(!minimize);
        } else {
            setMinimize(true);
        }
    }

    // handle delete
    const handleDelete = (evt) => {
        if (confirm(`Are you sure you want to delete ${team.name}?`)) {
            onDelete(team.id);
        }
        evt.stopPropagation();
    }

    useEffect(() => {
        setMinimize(player.teamID !== team.id);
    }, [player]);

    return (
        <div className="team-container">
            <div className="banner-container" onClick={bannerClick}>
                <Banner name={team.name} color={team.color} score={team.score} onDelete={handleDelete} />
            </div>
            {!minimize &&
                <>
                    <Players players={team.players} title="Team Members" />
                    <Chat player={player} data={data} id={team.id} onSubmit={onSubmit} />
                </>
            }
        </div>
    )
}

export default Team
