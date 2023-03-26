import React from 'react'

function Dropdown({ onChange, items, name, value }) {

    const render = () => {
        return items.map(item => {
            return <><option value={item.id}>{item.name}</option></>
        });
    }

    return (
        <>
            <select id={name} onChange={onChange} value={value} className="dropdown">
                <option value="">--Select--</option>
                {render()}
            </select>
        </>
    )
}

export default Dropdown;
