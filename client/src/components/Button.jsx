import React from 'react';

const Button = ({ color, text, type, disabled, onClick }) => {

    return (
        <button onClick={onClick} type={type} disabled={disabled} style={{ backgroundColor: disabled ? 'grey' : color }}
            className='btn'>
            {text}
        </button>
    )
}

Button.defaultProps = {
    color: 'steelblue',
    type: 'button',
    text: 'Click Me',
    disabled: false,
    onClick: () => { }
}

export default Button