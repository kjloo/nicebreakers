import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Players from './Players';
import GameControls from './GameControls';

const GameSetup = ({ socket, players, teams, started, onStart }) => {
    const maxTeams = 4;
    const [decode, setDecode] = useState("");

    const { gameID } = useParams();

    // is ready
    const isReady = () => {
        // ready when
        // there is at least 2 players
        // there are at least 2 teams
        // each player is on a team
        // each team has a player
        // game not started
        return ((players.length > 1) &&
            (teams.length > 1) &&
            (players.every((player) => player.teamID > 0)) &&
            (teams.every((team) => (players.find((player) => player.teamID === team.id) !== undefined))) &&
            !started);
    }

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
    };

    // submit team
    const submitTeam = (name, color) => {
        socket.emit('add team', { name: name, color: color });
    }

    useEffect(() => {
        processAcronym();
    }, [])

    return (
        <>
            <p className="label">Room Code: </p>
            <p className="value">{gameID}</p>
            <p className="value"> ({decode}) </p>
            <Players players={players} />
            <GameControls isLocked={started || teams.length >= maxTeams} isReady={isReady()} onSubmit={submitTeam} onStart={onStart} />
        </>
    )
}

export default GameSetup
