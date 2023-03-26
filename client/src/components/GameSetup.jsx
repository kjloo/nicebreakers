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
        // ready flag is set AND
        // there is at least 2 players AND
        // teams are not required OR
        // there are at least 2 teams AND
        // each player that is a player is on a team AND
        // each team has a player
        // game not started
        return readyFlag &&
            (players.length > 1) &&
            (
                (teams === null) ||
                (
                    (teams.length > 1) &&
                    (players.every((player) => (player.type !== PlayerType.PLAYER) || (player.teamID > 0))) &&
                    (teams.every((team) => (team.players.length > 0)))
                )
            );
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
            <div className='label'>
                <p>Room Code: </p>
                <p>{gameID} ({decode})</p>
            </div>
            <Players players={players} />
            <GameControls socket={socket} isLocked={(teams === null) || (teams.length >= maxTeams)} isReady={isReady()} onStart={onStart} />
        </>
    )
}

export default GameSetup
