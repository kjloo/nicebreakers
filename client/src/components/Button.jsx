import React from 'react';

const Button = ({ color, text, disabled, onClick }) => {

    return (
        <button onClick={onClick} disabled={disabled} style={{ backgroundColor: disabled ? 'grey' : color }}
            className='btn'>
            {text}
        </button>
    )
}

Button.defaultProps = {
    color: 'steelblue',
    text: 'Click Me',
    disabled: false,
    onClick: () => { }
}

export default Button