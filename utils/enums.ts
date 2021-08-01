export enum GameState {
    SETUP = 'setup',
    GUESS = 'guess',
    HINT = 'hint',
    STEAL = 'steal',
    ENTRY = 'entry',
    REVEAL = 'reveal',
    END = 'end'
};

export enum GameType {
    MOVIE,
    TRIVIA
};

export enum PlayerType {
    ADMIN,
    MASTER,
    PLAYER,
    OBSERVER
};