import React, { cloneElement, useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { GameState } from '../../../utils/enums';
import UserForm from './UserForm';
import Teams from './Teams';
import GameContainer from './GameContainer';
import GameSetup from './GameSetup';
import { PlayerType } from '../../../utils/enums';
import Button from './Button';

let socket;
const connectSocket = (gameID) => {
    socket = io("http://chingloo.zapto.org:1111", {
        query: {
            gameID: gameID
        }
    });
    socket.connect();
}

const GameSocket = ({ children, title, roles }) => {
    const [readyFlag, setReadyFlag] = useState(false);
    const [player, setPlayer] = useState(undefined);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [chat, setChat] = useState([]);
    const [state, setState] = useState(GameState.SETUP);
    const [question, setQuestion] = useState(undefined);
    const [winner, setWinner] = useState(undefined);

    const { gameID } = useParams();

    const inputFile = useRef(null);

    // basic util
    function isEmpty(obj) {
        if (obj === undefined || obj === null) {
            return true;
        }
        return Object.keys(obj).length === 0;
    }

    const nextState = (args = undefined) => {
        if (args && args.type !== undefined) {
            // ignore button evt click
            args = undefined;
        }
        if (args !== undefined && args.isEnd !== undefined && args.isEnd === true) {
            socket.emit('next state', { state: GameState.END, args: args });
        } else {
            socket.emit('next state', { state: state, args: args });
        }
    }

    // get player
    const getDefaultPlayer = () => {
        // Request player
        axios({
            method: 'get',
            url: '/player',
            params: {
                gameID: gameID
            }
        }).then((response) => {
            let player = response.data.player;
            if (player !== undefined) {
                submitPlayer(player);
            }
        });
    }
    // submit player
    const submitPlayer = (name, id = -1) => {
        socket.emit('add player', { name: name, id: id });
    }
    // get players
    const getPlayers = () => {
        // Request current players
        axios({
            method: 'get',
            url: '/players',
            params: {
                gameID: gameID
            }
        }).then((response) => {
            setPlayers(response.data.players);
            if (response.data.players.length === 0) {
                getDefaultPlayer();
            }
        });
    }

    // get state
    const getState = () => {
        // Request state
        axios({
            method: 'get',
            url: '/state',
            params: {
                gameID: gameID
            }
        }).then((response) => {
            setState(response.data.state);
        });
    }

    // delete team
    const deleteTeam = (id) => {
        socket.emit('delete team', { id: id });
    }
    // get teams
    const getTeams = () => {
        // Request current teams
        axios({
            method: 'get',
            url: '/teams',
            params: {
                gameID: gameID
            }
        }).then((response) => {
            setTeams(response.data.teams);
        });
    }

    const isStarted = () => {
        return state !== GameState.SETUP;
    }

    const hasGameMaster = () => {
        return roles.includes(PlayerType.MASTER);
    }

    const playerRoleButton = () => {
        if (!hasGameMaster()) {
            return;
        }
        if (!player) {
            return;
        }
        const text = (player.type === PlayerType.PLAYER) ? "Player" : "Master";
        const newRole = (player.type === PlayerType.PLAYER) ? PlayerType.MASTER : PlayerType.PLAYER;
        return <div className='role-button'>
            <Button
                color="darkviolet"
                text={text}
                disabled={player.teamID !== -1}
                onClick={() => socket.emit('change role', { type: newRole })} />
        </div>
    }

    const handleChange = (evt) => {
        evt.defaultPrevented;
        if (evt.target.files.length == 0) {
            evt.target.value = null;
            return;
        }
        const fileUpload = evt.target.files[0];
        evt.target.value = null;
        uploadData(fileUpload);
    }

    const uploadDataButton = () => {
        if (!hasGameMaster()) {
            return;
        }
        if (!player) {
            return;
        }

        return player.type === PlayerType.MASTER && <div className='upload-button'>
            <input type='file' id='file' ref={inputFile} onChange={handleChange} style={{ display: 'none' }} />
            <Button
                color="darkslategrey"
                text="Upload Data"
                onClick={() => inputFile.current.click()} />
        </div>
    }

    // join team
    const joinTeam = (team) => {
        if (!player) {
            return false;
        }
        if (player.type === PlayerType.MASTER) {
            alert('Game Master Cannot Join Teams');
            return false;
        }
        if (player.teamID !== team.id) {
            if (isStarted()) {
                alert('Game Already Started');
            } else {
                if (confirm(`Join Team ${team.name}`)) {
                    // update server
                    socket.emit('join team', team.id);
                    return true;
                } else {
                    return false;
                }
            }
        } else {
            return true;
        }
    }

    // chat message submit
    const submitMessage = (teamID, message) => {
        socket.emit('team chat', { teamID: teamID, message: message });
    }

    const uploadData = (data) => {
        socket.emit('upload data', data)
    }

    useEffect(() => {
        connectSocket(gameID);

        getPlayers();
        getState();
        getTeams();

        socket.on('exception', (message) => {
            alert(message);
        });
        socket.on('ready', (ready) => {
            setReadyFlag(ready);
        })
        socket.on('reveal answer', (question) => {
            console.log(question);
            setQuestion(question);
        })
        socket.on('set winner', (w) => {
            // Set winner to display
            setWinner(w);
        });
        socket.on('set state', (s) => {
            setState(s);
        });
        return function handleCleanUp() {
            socket.disconnect();
        }
    }, []);

    useEffect(() => {
        socket.on('update player', (p) => {
            if (p !== undefined) {
                setPlayer(p);
            }
        });
        socket.on('update players', (p) => {
            setPlayers(p);
            // See if new information about self
            if (!isEmpty(player)) {
                const update = p.find((update) => update.id === player.id);
                if (update !== undefined) {
                    setPlayer(update);
                }
            }
        });
        socket.on('connect', () => {
            // Player was previously defined
            if (player !== undefined) {
                submitPlayer(player.name, player.id);
            }
        });
        return () => {
            socket.off('update player');
            socket.off('update players');
            socket.off('connect')
        }
    }, [player, players])

    useEffect(() => {
        socket.on('add team', (t) => {
            // do not update your team
            setTeams([...teams, t]);
        });
        socket.on('delete team', (id) => {
            // do not update your team
            setTeams(teams.filter((team) => id !== team.id));
        });
        socket.on('team chat', (c) => {
            setChat(c);
        });
        socket.on('update teams', (t) => {
            setTeams(t);
        })
        return () => {
            socket.off('add team');
            socket.off('delete team');
            socket.off('team chat');
            socket.off('update teams');
        }
    }, [teams]);

    return (
        <>
            <div className="admin-buttons">
                {playerRoleButton()}
                {uploadDataButton()}
            </div>

            <GameContainer title={title} >
                {isEmpty(player) ?
                    <UserForm onSubmit={submitPlayer} /> :
                    isStarted() ?
                        cloneElement(children, { player: player, teams: teams, onNext: nextState, state: state, question: question }) :
                        <>
                            {winner && <h3 style={{ color: winner.color }}>Team {winner.name} Wins!</h3>}
                            <GameSetup socket={socket} readyFlag={readyFlag} players={players} teams={teams} onStart={nextState} />
                        </>
                }
            </GameContainer>
            <Teams player={player} teams={teams} chat={chat} onJoin={joinTeam} onSubmit={submitMessage} onDelete={deleteTeam} />
        </>

    )
}

GameSocket.defaultProps = {
    title: 'No Title',
    roles: [PlayerType.PLAYER]
}

export default GameSocket;
