import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import UserForm from './UserForm';
import Players from './Players';
import Teams from './Teams';
import GameControls from './GameControls';
import GameMenu from './GameMenu';

const socket = io("http://chingloo.zapto.org:1111");

const MovieGame = () => {
    const maxTeams = 4;
    const [user, setUser] = useState(-1);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);

    const { gameID } = useParams();

    // submit user
    const submitUser = (name) => {
        socket.emit('add user', { name: name });
    }
    // get users
    const getUsers = () => {
        // Request current teams
        axios({
            method: 'get',
            url: '/users',
        }).then((response) => {
            setUsers(response.data.users);
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
        }).then((response) => {
            setTeams(response.data.teams);
        });
    }

    // join team
    const joinTeam = (team) => {
        if (user.teamID !== team.id) {
            if (confirm(`Join Team ${team.name}`)) {
                // add team id for user
                user.teamID = team.id;
                // update server
                socket.emit('update user', { user: user });
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
        getUsers();
        getTeams();

        socket.on('exception', (message) => {
            alert(message);
        });
        socket.on('registered user', (user) => {
            setUser(user);
        });
        socket.on('update users', (users) => {
            setUsers(users);
        });
        socket.on('update teams', (teams) => {
            setTeams(teams);
        });
        socket.on('team chat', (teams) => {
            setTeams(teams);
        });
    }, []);

    return (
        <>
            <GameMenu title="Untitled Movie Game" >
                {user < 0 ? <UserForm onSubmit={submitUser} /> :
                    <>
                        <Players players={users} />
                        <GameControls isMaxTeams={teams.length >= maxTeams} onSubmit={submitTeam} />
                    </>
                }
            </GameMenu>
            <Teams teams={teams} players={users} onJoin={joinTeam} onSubmit={submitMessage} onDelete={deleteTeam} />
        </>

    )
}

export default MovieGame