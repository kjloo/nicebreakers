"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.TriviaController = void 0;
var enums_1 = require("./enums");
var gameController_1 = require("./gameController");
var emitter = require('./emitter');
var TriviaController = /** @class */ (function (_super) {
    __extends(TriviaController, _super);
    function TriviaController() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TriviaController.prototype.gameStateMachine = function (s, game, state, args) {
        switch (state) {
            case enums_1.GameState.SETUP:
                emitter.updateState(s, game, enums_1.GameState.ENTRY);
                break;
        }
    };
    return TriviaController;
}(gameController_1.GameController));
exports.TriviaController = TriviaController;
;
