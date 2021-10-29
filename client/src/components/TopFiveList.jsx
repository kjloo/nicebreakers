import React from 'react'

function TopFiveList({ list }) {
    return (
        <ol className="topfive-option">{list.map(item => {
            return <li>{item}</li>
        })}
        </ol>
    )
}

export default TopFiveList;
