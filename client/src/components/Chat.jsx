import React, { useState } from 'react'

const Chat = ({ data, id, onSubmit }) => {
    const [message, setMessage] = useState('');

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
