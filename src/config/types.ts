/**
 * The territory type
 */
export type Territory = "alaska" | "northwest_territory" | "greenland" | "alberta" | "ontario" | "quebec" | "western_united_states" | "eastern_united_states" | "central_america" | "venezuela" | "peru" | "brazil" | "argentina" | "iceland" | "scandinavia" | "ukraine" | "great_britain" | "northern_europe" | "western_europe" | "southern_europe" | "north_africa" | "egypt" | "east_africa" | "congo" | "south_africa" | "madagascar" | "ural" | "siberia" | "yakursk" | "kamchatka" | "irkutsk" | "mongolia" | "japan" | "afghanistan" | "china" | "middle_east" | "india" | "siam" | "indonesia" | "new_guinea" | "western_australia" | "eastern_australia";

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
}

/**
 * The interval type
 */
export type Interval = [number, number];