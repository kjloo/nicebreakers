import React from 'react';

const ColoredText = ({ color, text }) => {
    return (
        <text style={{ color: color }}>
            {text}
        </text >
    );
};

ColoredText.defaultProps = {
    color: 'green',
    text: 'Success'
};

export default ColoredText;