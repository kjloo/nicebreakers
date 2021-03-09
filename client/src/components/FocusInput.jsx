import React, { useEffect, useRef } from 'react'

const FocusInput = ({ type, onChange, placeholder, value, required }) => {
    const focusRef = useRef(null);

    useEffect(() => {
        focusRef.current.focus();
    }, []);

    return (
        <input ref={focusRef} type={type} onChange={onChange} placeholder={placeholder} value={value} required={required} />
    )
}

FocusInput.defaultProps = {
    type: 'text',
    onChange: () => { },
    placeholder: '',
    value: '',
    required: false
}

export default FocusInput;
