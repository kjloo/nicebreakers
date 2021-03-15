import React from 'react'
import Button from './Button';

const AnswerValidator = ({ onAnswer }) => {
    const rightAnswer = () => {
        onAnswer({ correct: true });
    }

    const wrongAnswer = () => {
        onAnswer({ correct: false });
    }
    return (
        <div>
            <Button text="Right" color="green" onClick={rightAnswer} />
            <Button text="Wrong" color="red" onClick={wrongAnswer} />
        </div>
    )
}

export default AnswerValidator;
