/**
 * The territory type
 */
export type Territory =
	| "alaska"
	| "northwest_territory"
	| "greenland"
	| "alberta"
	| "ontario"
	| "quebec"
	| "western_united_states"
	| "eastern_united_states"
	| "central_america"
	| "venezuela"
	| "peru"
	| "brazil"
	| "argentina"
	| "iceland"
	| "scandinavia"
	| "ukraine"
	| "great_britain"
	| "northern_europe"
	| "western_europe"
	| "southern_europe"
	| "north_africa"
	| "egypt"
	| "east_africa"
	| "congo"
	| "south_africa"
	| "madagascar"
	| "ural"
	| "siberia"
	| "yakursk"
	| "kamchatka"
	| "irkutsk"
	| "mongolia"
	| "japan"
	| "afghanistan"
	| "china"
	| "middle_east"
	| "india"
	| "siam"
	| "indonesia"
	| "new_guinea"
	| "western_australia"
	| "eastern_australia";

/**
 * The ownership of each territory
 */
export type TerritoryOwnership = {
	[key in Territory]: {
		/**
		 * The player that owns the territory
		 */
		player: number;
		/**
		 * The number of troops in the territory
		 */
		troops: number;
	};
};

/**
 * The player object
 */
export type Player = {
	/**
	 * The name of the player
	 */
	name?: string;
	/**
	 * The color of the player
	 */
	color?: string;
	/**
	 * Amount of troops which can be deployed to owned territories
	 */
	troopsToDeploy: number;
};

/**
 * The interval type
 */
export type Interval = [number, number];

export interface Context {
	currentPlayer: number;
	ownership: TerritoryOwnership;
	potentialTargetTerritories: Territory[];
	fromTerritory: Territory | null;
	toTerritory: Territory | null;
	allBorders: [Territory, Territory[]][];
	allTerritories: Territory[];
	players: Player[];
	error: string;
	attackerTroops: number;
}

export interface SelectTerritoryEvent {
	type: RiskEventType.SELECT_TERRITORY;
	territory: Territory;
}

export interface SelectTroopsEvent {
	type: RiskEventType.MOVE;
	territory?: Territory;
	troops: number;
}

export enum RiskEventType {
	SELECT_TERRITORY = "SELECT_TERRITORY",
	END_TURN = "END_TURN",
	RESOLVE = "RESOLVE",
	GAME_OVER = "GAME_OVER",
	MOVE = "MOVE",
	BACK = "BACK",
	CONTINUE = "CONTINUE"
}

export type RiskEvent = SelectTerritoryEvent | SelectTroopsEvent | {type: RiskEventType};

export type RiskGuard<T> = {
	context: Context;
	event: T;
};

export interface Continent {
	name: string;
	bonus: number;
	territories: Territory[];
}
