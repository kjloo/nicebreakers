import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import MovieMenu from './components/MovieMenu';
import MovieGame from './components/MovieGame';
import About from './components/About';
import Footer from './components/Footer';

const App = () => {
    return (
        <div>
            <Router>
                <Navbar />
                <div className='content'>
                    <Switch>
                        <Route exact path="/" component={Home} />
                        <Route exact path="/movie" component={MovieMenu} />
                        <Route exact path="/movie/game/:gameID" component={MovieGame} />
                        <Route exact path="/about" component={About} />
                    </Switch>
                </div>
                <Footer />
            </Router>
        </div>
    )
}

export default App