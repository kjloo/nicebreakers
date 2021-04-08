import React, { useState } from 'react'
import FocusInput from './FocusInput'

const UserForm = ({ onSubmit, text }) => {
    const [name, setName] = useState('');

    // handle submit
    const handleSubmit = (evt) => {
        evt.preventDefault();
        onSubmit(name);
    }

    return (
        <form className='option-form' onSubmit={handleSubmit}>
            <FocusInput type='text' value={name} placeholder={text} onChange={(e) => setName(e.target.value)} required="required" />
            <input type='submit' value="Submit" />
        </form>
    )
}

UserForm.defaultProps = {
    text: 'Enter Name',
    onSubmit: (name) => { }
}

export default UserForm;
