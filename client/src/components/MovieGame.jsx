import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
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
    const [state, setState] = useState(false);
    const [started, setStarted] = useState(false);
    const [answer, setAnswer] = useState('');

    const { gameID } = useParams();

    // basic util
    function isEmpty(obj) {
        if (obj === undefined || obj === null) {
            return true;
        }
        return Object.keys(obj).length === 0;
    }

    // alert stop
    const alertStop = () => {
        socket.emit('alert stop');
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

    // give answer
    const giveAnswer = (right) => {
        socket.emit('give answer', { right: right, state: state });
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
    // start game
    const startGame = () => {
        setStarted(true);
        socket.emit('start game');
    }

    // next turn
    const nextTurn = () => {
        socket.emit('next turn');
    }

    // chat message submit
    const submitMessage = (id, message) => {
        socket.emit('team chat', { id: id, message: message });
    }

    // set movie
    const submitMovie = (movie) => {
        socket.emit('set answer', { answer: movie });
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
        socket.on('start game', (s) => {
            console.log(s);
            setStarted(true);
            setState(s);
        });
        socket.on('set state', (s) => {
            setState(s);
        })

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
        socket.on('team chat', (chat) => {
            setTeams(teams.map((team) => {
                if (chat.teamID === team.id) {
                    return { ...team, data: chat.data };
                } else {
                    return team;
                }
            }));
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
                {started ? <MovieInstruction player={player} teams={teams} onSubmit={submitMovie} onStop={alertStop} onAnswer={giveAnswer} onNext={nextTurn} state={state} answer={answer} /> :
                    isEmpty(player) ? <UserForm onSubmit={submitPlayer} /> :
                        <GameSetup socket={socket} players={players} teams={teams} started={started} onStart={startGame} />
                }
            </GameMenu>
            <Teams player={player} teams={teams} players={players} onJoin={joinTeam} onSubmit={submitMessage} onDelete={deleteTeam} />
        </>

    )
}

export default MovieGame
