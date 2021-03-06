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
    const [player, setPlayer] = useState(-1);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);

    const { gameID } = useParams();

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
                // add team id for player
                player.teamID = team.id;
                // update server
                socket.emit('update player', { player: player });
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

        getPlayers();
        getTeams();

        socket.on('exception', (message) => {
            alert(message);
        });
        socket.on('registered player', (player) => {
            setPlayer(player);
        });
        socket.on('update players', (players) => {
            setPlayers(players);
        });
        socket.on('update teams', (teams) => {
            setTeams(teams);
        });
        socket.on('team chat', (teams) => {
            setTeams(teams);
        });

        return function handleCleanUp() {
            socket.close();
        }
    }, []);

    return (
        <>
            <GameMenu title="Untitled Movie Game" >
                {player < 0 ? <UserForm onSubmit={submitPlayer} /> :
                    <>
                        <Players players={players} />
                        <GameControls isMaxTeams={teams.length >= maxTeams} onSubmit={submitTeam} />
                    </>
                }
            </GameMenu>
            <Teams teams={teams} players={players} onJoin={joinTeam} onSubmit={submitMessage} onDelete={deleteTeam} />
        </>

    )
}

export default MovieGame
