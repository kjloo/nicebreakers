import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import enums from '../../../utils/enums';
import UserForm from './UserForm';
import Teams from './Teams';
import GameMenu from './GameMenu';
import GameSetup from './GameSetup';
import MovieInstruction from './MovieInstruction';

let socket;
const initializeSocket = (gameID) => {
    socket = io("http://chingloo.zapto.org:1111", {
        query: `gameID=${gameID}`
    });
}

const MovieGame = () => {
    const [player, setPlayer] = useState({});
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [chat, setChat] = useState([]);
    const [state, setState] = useState(enums.GameState.SETUP);
    const [started, setStarted] = useState(false);
    const [answer, setAnswer] = useState('');
    const [winner, setWinner] = useState(undefined);

    const { gameID } = useParams();

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
            socket.emit('next state', { state: enums.GameState.END, args: args });
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
                setPlayer(player);
            }
        });
    }
    // submit player
    const submitPlayer = (name) => {
        socket.emit('add player', { name: name });
    }
    // get players
    const getPlayers = () => {
        // Request current teams
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

    // join team
    const joinTeam = (team) => {
        if (player.teamID !== team.id) {
            if (started) {
                alert('Game Already Started');
            } else {
                if (confirm(`Join Team ${team.name}`)) {
                    // update server
                    socket.emit('join team', { teamID: team.id });
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
    const submitMessage = (id, message) => {
        socket.emit('team chat', { id: id, message: message });
    }

    useEffect(() => {
        initializeSocket(gameID);

        getPlayers();
        getTeams();

        socket.on('exception', (message) => {
            alert(message);
        });
        socket.on('reveal answer', (answer) => {
            setAnswer(answer);
        })
        socket.on('set started', (s) => {
            setStarted(s);
        });
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
                setPlayer(p.find((update) => update.id === player.id));
            }
        });
        return () => {
            socket.off('update player');
            socket.off('update players');
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
        }
    }, [teams]);

    return (
        <>
            <GameMenu title="Untitled Movie Game" >
                {started ?
                    <MovieInstruction player={player} teams={teams} onNext={nextState} state={state} answer={answer} /> :
                    isEmpty(player) ?
                        <UserForm onSubmit={submitPlayer} /> :
                        <>
                            {winner && <h3 style={{ color: winner.color }}>Team {winner.name} Wins!</h3>}
                            <GameSetup socket={socket} players={players} teams={teams} started={started} onStart={nextState} />
                        </>
                }
            </GameMenu>
            <Teams player={player} teams={teams} chat={chat} players={players} onJoin={joinTeam} onSubmit={submitMessage} onDelete={deleteTeam} />
        </>

    )
}

export default MovieGame
