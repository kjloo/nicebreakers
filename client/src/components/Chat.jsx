import React, { useState, useRef, useEffect } from 'react'

const Chat = ({ data, id, onSubmit }) => {
    const divRef = useRef(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        divRef.current.scrollIntoView({ behavior: 'smooth' });
    });

    // handle message
    const handleMessage = (event) => {
        setMessage(event.target.value);
    }

    // submit message
    const submitMessage = (evt) => {
        evt.preventDefault();
        onSubmit(id, message);
        setMessage('');
    }

    return (
        <div>
            <h4>Chat</h4>
            <div className='chat-area'>
                {data.length > 0 && data.map((line) => {
                    return <p>{line}</p>
                })}
                <div ref={divRef}></div>
            </div>
            <form className='chat-input' onSubmit={submitMessage}>
                <input type="text" value={message} onChange={handleMessage} />
                <input className="submit" type="submit" value=">>" />
            </form>
        </div>
    )
}

Chat.defaultProps = {
    data: []
}

export default Chat;
