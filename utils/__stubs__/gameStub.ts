import { GameState, GameType, PlayerType } from "../enums";
import { Game, Player, Team } from "../structs";

// Setup in memory data
export const jake: Player = new Player("1", PlayerType.PLAYER, "Jake", false, -1);
export const finn: Player = new Player("2", PlayerType.PLAYER, "Finn", false, -1);
export const tom: Player = new Player("3", PlayerType.PLAYER, "Tom", true, -1);
export const bob: Player = new Player("4", PlayerType.PLAYER, "Bob", false, 1042);
export const sean: Player = new Player("5", PlayerType.PLAYER, "Sean", false, 1042);
export const phil: Player = new Player("6", PlayerType.PLAYER, "Phil", false, 5431);
export const sam: Player = new Player("7", PlayerType.PLAYER, "Sam", false, 5431);
export const charles: Player = new Player("8", PlayerType.PLAYER, "Charles", false, 5431);

export const fish: Team = new Team(1042, 'Fish', '#FF6622', 0, true, [], [bob, sean], 0);
export const cat: Team = new Team(5431, 'Cat', '#993355', 0, false, [], [phil, sam], 0);
export const teams: Array<Team> = [fish, cat];
export const players: Array<Player> = [jake, finn, tom, bob, sean, phil, sam];
export const game: Game = new Game("ABDS", GameType.MOVIE, 0, teams, new Map([[jake.id, jake], [finn.id, finn], [tom.id, tom]]), [charles], GameState.SETUP, undefined);