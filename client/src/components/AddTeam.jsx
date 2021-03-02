import React, { useState } from 'react'

const AddTeam = ({ setAddTeam, onSubmit }) => {
    const [name, setName] = useState("");
    const [color, setColor] = useState("black");

    // submit team
    const submitTeam = (evt) => {
        evt.preventDefault();
        onSubmit(name, color);
        setName('');
        setColor('');
        setAddTeam(false);
    }

    return (
        <form className='option-form' onSubmit={submitTeam}>
            <input type='text' onChange={(e) => setName(e.target.value)} value={name} placeholder="Enter Team Name" required />
            <input type='color' onChange={(e) => setColor(e.target.value)} value={color} required />
            <input type='submit' value='Add' />
        </form>
    )
}

export default AddTeam;
