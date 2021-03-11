import React from 'react'
import Button from './Button';

const AnswerValidator = ({ onAnswer }) => {
    const rightAnswer = () => {
        onAnswer(true);
    }

    const wrongAnswer = () => {
        onAnswer(false);
    }
    return (
        <>
            <Button text="Right" color="green" onClick={rightAnswer} />
            <Button text="Wrong" color="red" onClick={wrongAnswer} />
        </>
    )
}

export default AnswerValidator;
