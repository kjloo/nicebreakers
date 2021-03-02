import React from 'react'

const Banner = ({ name, color, score, onDelete }) => {
    return (
        <div className="banner" >
            <div className="box" style={{ backgroundColor: color }}></div>
            <h2>{name}</h2>
            <p>{score}</p>

            <button className="delete-button" onClick={onDelete}>x</button>
        </div>
    )
}

export default Banner;
