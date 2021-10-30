import React from 'react'

function RadioGroup({ onChange, items, name }) {

    const render = () => {
        return items.map((item, index) => {
            return <><input type='radio' name={name} id={index} value={item.index} checked={item.checked} /><label for={index}>{item.content}</label></>
        });
    }

    return (
        <div className='radio-group' onChange={onChange}>
            {render()}
        </div>
    )
}

export default RadioGroup;
