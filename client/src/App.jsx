import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Navbar from './components/Navbar';
import Name from './components/Name';
import Button from './components/Button';
import Footer from './components/Footer';
import Team from './components/Team';
import AddTeam from './components/AddTeam';

const socket = io();

const App = () => {
    const maxTeams = 4;
    const [addTeam, setAddTeam] = useState(false);
    const [teams, setTeams] = useState([]);

    // toggle add team
    const toggleAddTeam = () => {
        setAddTeam(!addTeam);
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

    // chat message submit
    const submitMessage = (id, message) => {
        socket.emit('team chat', { id: id, message: message });
    }

    useEffect(() => {
        getTeams();

        socket.on('exception', (message) => {
            alert(message);
        })
        socket.on('update teams', (teams) => {
            setTeams(teams);
        });
        socket.on('team chat', (teams) => {
            setTeams(teams);
        });
    }, []);

    return (
        <div>
            <Navbar />
            <div className="container">
                <Name />
                <div className="game-controls">
                    {addTeam && <AddTeam setAddTeam={setAddTeam} onSubmit={submitTeam} />}
                    <Button text={!addTeam ? "Add Team" : "Close"} color={!addTeam ? "lightskyblue" : "red"} disabled={teams.length >= maxTeams} onClick={toggleAddTeam} />
                    {!addTeam && <Button text="Start Game" color="green" />}
                </div>
            </div>
            <div className="teams-footer">
                {teams.length > 0 && teams.map((team) => {
                    return <Team id={team.id} team={team} onSubmit={submitMessage} onDelete={deleteTeam} />
                })}
            </div>
            <Footer />
        </div>
    )
}

export default App