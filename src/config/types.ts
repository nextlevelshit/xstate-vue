export type Territory = "alaska" | "northwest_territory" | "greenland" | "alberta" | "ontario" | "quebec" | "western_united_states" | "eastern_united_states" | "central_america" | "venezuela" | "peru" | "brazil" | "argentina" | "iceland" | "scandinavia" | "ukraine" | "great_britain" | "northern_europe" | "western_europe" | "southern_europe" | "north_africa" | "egypt" | "east_africa" | "congo" | "south_africa" | "madagascar" | "ural" | "siberia" | "yakursk" | "kamchatka" | "irkutsk" | "mongolia" | "japan" | "afghanistan" | "china" | "middle_east" | "india" | "siam" | "indonesia" | "new_guinea" | "western_australia" | "eastern_australia";
export type TerritoryOwnership = {
	[key in Territory]: {
		player: number;
		troops: number;
	};
};
export type Player = {
	// territories?: number;
	troopsToDeploy: number;
	// troops: number;
	name?: string;
	color?: string;
}
