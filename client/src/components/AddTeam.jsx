import React, { useState, useEffect } from 'react'
import FocusInput from './FocusInput';

const AddTeam = ({ setAddTeam, onSubmit }) => {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#000000");

    // submit team
    const submitTeam = (evt) => {
        evt.preventDefault();
        onSubmit(name, color);
        setName('');
        setColor('');
        setAddTeam(false);
    }

    useEffect(() => {
        let randomColor = Math.floor(Math.random() * 16777215).toString(16);
        setColor(`#${randomColor}`);
    }, []);

    return (
        <form className='option-form' onSubmit={submitTeam}>
            <FocusInput type='text' onChange={(e) => setName(e.target.value)} placeholder="Enter Team Name" value={name} required="required" />
            <input type='color' onChange={(e) => setColor(e.target.value)} value={color} required />
            <input type='submit' value='Add' />
        </form>
    )
}

export default AddTeam;
