import React, { useEffect, useRef } from 'react'

const FocusInput = ({ name, type, onChange, onKeyPress, placeholder, length, value, required }) => {
    const focusRef = useRef(null);

    useEffect(() => {
        focusRef.current.focus();
    }, []);

    return (
        <input ref={focusRef} name={name} type={type} onChange={onChange} onKeyPress={onKeyPress} placeholder={placeholder} maxLength={length} value={value} required={required} />
    )
}

FocusInput.defaultProps = {
    name: 'name',
    type: 'text',
    onChange: () => { },
    placeholder: '',
    length: '',
    value: '',
    required: false
}

export default FocusInput;
