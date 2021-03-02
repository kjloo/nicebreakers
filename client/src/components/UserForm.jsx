import React, { useState } from 'react'

const UserForm = ({ onSubmit }) => {
    const [name, setName] = useState('');

    // handle submit
    const handleSubmit = (evt) => {
        evt.preventDefault();
        onSubmit(name);
    }

    return (
        <form className='option-form' onSubmit={handleSubmit}>
            <input type='text' value={name} placeholder="Enter Name" onChange={(e) => setName(e.target.value)} />
            <input type='submit' value="Submit" />
        </form>
    )
}

export default UserForm;
