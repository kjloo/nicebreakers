import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import UserForm from './UserForm';
import Players from './Players';
import Teams from './Teams';
import GameControls from './GameControls';
import GameMenu from './GameMenu';

let socket;
const initializeSocket = (gameID) => {
    socket = io("http://chingloo.zapto.org:1111", {
        query: `gameID=${gameID}`
    });
}

const MovieGame = () => {
    const maxTeams = 4;
    const [decode, setDecode] = useState("");
    const [player, setPlayer] = useState(-1);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);

    const { gameID } = useParams();

    // process acronym
    const processAcronym = () => {
        // Get request
        axios({
            method: 'get',
            url: '/acronym',
            params: {
                gameID: gameID
            }
        }).then((response) => {
            setDecode(response.data.decode);
        });
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

    // submit team
    const submitTeam = (name, color) => {
        socket.emit('add team', { name: name, color: color });
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
            if (confirm(`Join Team ${team.name}`)) {
                // update server
                socket.emit('join team', { teamID: team.id });
                return true;
            } else {
                return false;
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
        processAcronym();

        getPlayers();
        getTeams();

        socket.on('exception', (message) => {
            alert(message);
        });
        socket.on('update player', (p) => {
            setPlayer(p);
        });
        socket.on('update players', (p) => {
            setPlayers(p);
        });
        socket.on('team chat', (t) => {
            setTeams(t);
        });

        return function handleCleanUp() {
            socket.disconnect();
        }
    }, []);

    useEffect(() => {
        socket.on('add team', (t) => {
            // do not update your team
            setTeams([...teams, t]);
        });
        socket.on('delete team', (id) => {
            // do not update your team
            setTeams(teams.filter((team) => id !== team.id));
        });
        return () => {
            socket.off('add team');
            socket.off('delete team');
        }
    }, [teams]);

    return (
        <>
            <GameMenu title="Untitled Movie Game" >
                {player < 0 ? <UserForm onSubmit={submitPlayer} /> :
                    <>
                        <p className="label">Room Code: </p>
                        <p className="value">{gameID}</p>
                        <p className="value"> ({decode}) </p>
                        <Players players={players} />
                        <GameControls isMaxTeams={teams.length >= maxTeams} onSubmit={submitTeam} />
                    </>
                }
            </GameMenu>
            <Teams player={player} teams={teams} players={players} onJoin={joinTeam} onSubmit={submitMessage} onDelete={deleteTeam} />
        </>

    )
}

export default MovieGame
