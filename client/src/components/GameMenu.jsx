import React from 'react'
import Name from './Name'

const GameMenu = ({ children, title }) => {
    return (
        <div className="game-container">
            <Name title={title} />
            {children}
        </div>
    )
}

export default GameMenu;
