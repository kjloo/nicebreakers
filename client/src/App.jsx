import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

const Navbar = lazy(() => import('./components/Navbar'));
const Home = lazy(() => import('./components/Home'));
const Games = lazy(() => import('./components/Games'));
const MovieMenu = lazy(() => import('./components/MovieMenu'));
const MovieGame = lazy(() => import('./components/MovieGame'));
const TriviaMenu = lazy(() => import('./components/TriviaMenu'));
const TriviaGame = lazy(() => import('./components/TriviaGame'));
const TopFiveMenu = lazy(() => import('./components/TopFiveMenu'));
const TopFiveGame = lazy(() => import('./components/TopFiveGame'));
const EqualMatchMenu = lazy(() => import('./components/EqualMatchMenu'));
const EqualMatchGame = lazy(() => import('./components/EqualMatchGame'));
const About = lazy(() => import('./components/About'));
const Footer = lazy(() => import('./components/Footer'));

const App = () => {
    return (
        <div className='app-container'>
            <Router>
                <Suspense fallback={<div>Loading...</div>}>
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
                            <Route exact path="/equalmatch" component={EqualMatchMenu} />
                            <Route exact path="/equalmatch/game/:gameID" component={EqualMatchGame} />
                            <Route exact path="/about" component={About} />
                        </Switch>
                    </div>
                    <Footer />
                </Suspense>
            </Router>
        </div>
    );
};

export default App;