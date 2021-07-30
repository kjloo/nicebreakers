"use strict";
exports.__esModule = true;
exports.GameType = exports.GameState = void 0;
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
