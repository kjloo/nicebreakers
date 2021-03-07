import React, { useState, useRef, useEffect } from 'react'
import FocusInput from './FocusInput';

const Chat = ({ player, data, id, onSubmit }) => {
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
                <ul className='chat-list'>
                    {data.length > 0 && data.map((d) => {
                        return <li className={player.id === d.player.id ? 'self-message' : 'team-message'}>
                            <p className='player-name'>{d.player.name}: </p>
                            <p className='message'>{d.message}</p>
                        </li>
                    })}
                </ul>
                <div ref={divRef}></div>
            </div>
            <form className='chat-input' onSubmit={submitMessage}>
                <FocusInput type="text" value={message} onChange={handleMessage} required="required" />
                <input className="submit" type="submit" value=">>" />
            </form>
        </div>
    )
}

Chat.defaultProps = {
    data: []
}

export default Chat;
