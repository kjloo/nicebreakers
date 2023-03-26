import React from 'react'

function Dropdown({ onChange, items, name, value }) {

    const render = () => {
        return items.map(item => {
            return <><option value={item.id}>{item.name}</option></>
        });
    }

    return (
        <>
            <select id={name} onChange={onChange} value={value}>
                <option value="">--Please choose an option--</option>
                {render()}
            </select>
        </>
    )
}

export default Dropdown;
