import React from 'react'

const Counter = ({ count }) => {
    return (
        <div>
            <p>Count is: {count}</p>
        </div>
    )
}

Counter.defaultProps = {
    count: 0,
}

export default Counter;
