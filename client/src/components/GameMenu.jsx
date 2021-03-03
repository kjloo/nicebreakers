import React from 'react'
import Name from './Name'

const GameMenu = ({ children, title }) => {
    return (
        <div className="title-container">
            <Name title={title} />
            {children}
        </div>
    )
}

export default GameMenu;
