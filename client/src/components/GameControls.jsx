import React, { useState } from 'react'
import AddTeam from './AddTeam';
import Button from './Button';

const GameControls = ({ isMaxTeams, onSubmit }) => {
    const [addTeam, setAddTeam] = useState(false);

    // toggle add team
    const toggleAddTeam = () => {
        setAddTeam(!addTeam);
    }

    return (
        <div className="game-controls">
            {addTeam && <AddTeam setAddTeam={setAddTeam} onSubmit={onSubmit} />}
            <Button text={!addTeam ? "Add Team" : "Close"} color={!addTeam ? "lightskyblue" : "red"} disabled={isMaxTeams} onClick={toggleAddTeam} />
            {!addTeam && <Button text="Start Game" color="green" />}
        </div>
    )
}

export default GameControls;
