import React from 'react';

const Button = ({ color, text, type, disabled, onClick, value }) => {

    return (
        <button onClick={onClick} type={type} value={value} disabled={disabled} style={{ backgroundColor: disabled ? 'grey' : color }}
            className='btn'>
            {text}
        </button>
    )
}

Button.defaultProps = {
    color: 'steelblue',
    type: 'button',
    text: 'Click Me',
    value: '',
    disabled: false,
    onClick: () => { }
}

export default Button