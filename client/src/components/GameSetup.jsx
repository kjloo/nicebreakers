import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Players from './Players';
import GameControls from './GameControls';
import { PlayerType } from '../../../utils/enums';

const GameSetup = ({ socket, readyFlag, players, teams, onStart }) => {
    const maxTeams = 4;
    const [decode, setDecode] = useState("");

    const { gameID } = useParams();

    // is ready
    const isReady = () => {
        // ready when
        // ready flag is set
        // there is at least 2 players
        // there are at least 2 teams
        // each player that is a player is on a team
        // each team has a player
        // game not started
        return readyFlag && ((players.length > 1) &&
            (teams.length > 1) &&
            (players.every((player) => (player.type !== PlayerType.PLAYER) || (player.teamID > 0))) &&
            (teams.every((team) => (team.players.length > 0))));
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

    useEffect(() => {
        processAcronym();
    }, [])

    return (
        <>
            <p className="label">Room Code: </p>
            <p className="value">{gameID}</p>
            <p className="value"> ({decode}) </p>
            <Players players={players} />
            <GameControls socket={socket} isLocked={teams.length >= maxTeams} isReady={isReady()} onStart={onStart} />
        </>
    )
}

export default GameSetup
