import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MovieMenu from './components/MovieMenu';
import MovieGame from './components/MovieGame';
import About from './components/About';
import Footer from './components/Footer';

const App = () => {
    return (
        <div>
            <Router>
                <Navbar />
                <Switch>
                    <Route exact path="/" />
                    <Route exact path="/movie" component={MovieMenu} />
                    <Route exact path="/movie/:id" component={MovieGame} />
                    <Route exact path="/about" component={About} />
                </Switch>
                <Footer />
            </Router>
        </div>
    )
}

export default App