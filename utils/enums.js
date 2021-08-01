"use strict";
exports.__esModule = true;
exports.PlayerType = exports.GameType = exports.GameState = void 0;
var GameState;
(function (GameState) {
    GameState["SETUP"] = "setup";
    GameState["GUESS"] = "guess";
    GameState["HINT"] = "hint";
    GameState["STEAL"] = "steal";
    GameState["ENTRY"] = "entry";
    GameState["REVEAL"] = "reveal";
    GameState["END"] = "end";
})(GameState = exports.GameState || (exports.GameState = {}));
;
var GameType;
(function (GameType) {
    GameType[GameType["MOVIE"] = 0] = "MOVIE";
    GameType[GameType["TRIVIA"] = 1] = "TRIVIA";
})(GameType = exports.GameType || (exports.GameType = {}));
;
var PlayerType;
(function (PlayerType) {
    PlayerType[PlayerType["ADMIN"] = 0] = "ADMIN";
    PlayerType[PlayerType["MASTER"] = 1] = "MASTER";
    PlayerType[PlayerType["PLAYER"] = 2] = "PLAYER";
    PlayerType[PlayerType["OBSERVER"] = 3] = "OBSERVER";
})(PlayerType = exports.PlayerType || (exports.PlayerType = {}));
;
