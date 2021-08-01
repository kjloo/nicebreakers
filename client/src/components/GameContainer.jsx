import React from 'react'
import Name from './Name'

const GameContainer = ({ children, title }) => {
    return (
        <div className="game-container">
            <Name title={title} />
            {children}
        </div >
    )
}

export default GameContainer;
