import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Games from './components/Games';
import MovieMenu from './components/MovieMenu';
import MovieGame from './components/MovieGame';
import TriviaMenu from './components/TriviaMenu';
import TriviaGame from './components/TriviaGame';
import About from './components/About';
import Footer from './components/Footer';

const App = () => {
    return (
        <div className='app-container'>
            <Router>
                <Navbar />
                <div className='content'>
                    <Switch>
                        <Route exact path="/" component={Home} />
                        <Route exact path="/games" component={Games} />
                        <Route exact path="/movie" component={MovieMenu} />
                        <Route exact path="/movie/game/:gameID" component={MovieGame} />
                        <Route exact path="/trivia" component={TriviaMenu} />
                        <Route exact path="/trivia/game/:gameID" component={TriviaGame} />
                        <Route exact path="/topfive" component={TopFiveMenu} />
                        <Route exact path="/topfive/game/:gameID" component={TopFiveGame} />
                        <Route exact path="/about" component={About} />
                    </Switch>
                </div>
                <Footer />
            </Router>
        </div>
    )
}

export default App