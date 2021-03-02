import React, { useState } from 'react'
import Chat from './Chat';
import Banner from './Banner';

const Team = ({ team, onSubmit, onDelete }) => {
    const [minimize, setMinimize] = useState(true);

    // handle click
    const bannerClick = () => {
        setMinimize(!minimize);
    }

    // handle delete
    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete ${team.name}?`)) {
            onDelete(team.id);
        }
    }

    return (
        <div className="team-container">
            <div className="banner-container" onClick={bannerClick}>
                <Banner name={team.name} color={team.color} score={team.score} onDelete={handleDelete} />
            </div>
            {!minimize && <Chat data={team.data} id={team.id} onSubmit={onSubmit} />}
        </div>
    )
}

export default Team
