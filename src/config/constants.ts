import {Territory, Interval, Continent} from "./types.ts";

export const stateKey = "risk:state";
export const allBorders: [Territory, Territory[]][] = [
	// Debug Mode
	// ["alaska", ["northwest_territory", "greenland", "alberta"]],
	// ["northwest_territory", ["alaska", "alberta", "ontario"]],
	// ["greenland", ["northwest_territory", "alberta", "ontario"]],
	// ["alberta", ["northwest_territory", "ontario", "greenland", "alaska"]],
	// ["ontario", ["alberta", "northwest_territory", "greenland", "greenland"]],

	["alaska", ["northwest_territory", "kamchatka", "alberta"]],
	["northwest_territory", ["alaska", "alberta", "greenland", "ontario"]],
	["greenland", ["northwest_territory", "quebec", "ontario", "iceland"]],
	["alberta", ["northwest_territory", "ontario", "western_united_states", "alaska"]],
	["ontario", ["alberta", "northwest_territory", "western_united_states", "eastern_united_states", "quebec", "greenland"]],
	["quebec", ["greenland", "ontario", "eastern_united_states"]],
	["western_united_states", ["alberta", "ontario", "eastern_united_states", "central_america"]],
	["eastern_united_states", ["ontario", "quebec", "western_united_states", "central_america"]],
	["central_america", ["western_united_states", "eastern_united_states", "venezuela"]],
	["venezuela", ["central_america", "peru", "brazil"]],
	["peru", ["venezuela", "brazil", "argentina"]],
	["brazil", ["venezuela", "peru", "argentina", "north_africa"]],
	["argentina", ["peru", "brazil"]],
	["iceland", ["greenland", "scandinavia", "great_britain"]],
	["scandinavia", ["iceland", "ukraine", "great_britain", "northern_europe"]],
	["ukraine", ["scandinavia", "northern_europe", "southern_europe", "ural", "afghanistan", "middle_east"]],
	["great_britain", ["iceland", "scandinavia", "western_europe", "northern_europe", "southern_europe"]],
	["northern_europe", ["great_britain", "ukraine", "southern_europe", "western_europe", "scandinavia"]],
	["western_europe", ["northern_europe", "southern_europe", "north_africa", "great_britain"]],
	["southern_europe", ["western_europe", "northern_europe", "ukraine", "middle_east", "egypt", "north_africa"]],
	["north_africa", ["brazil", "western_europe", "southern_europe", "egypt", "east_africa", "congo"]],
	["egypt", ["north_africa", "east_africa", "middle_east", "southern_europe"]],
	["east_africa", ["egypt", "north_africa", "congo", "south_africa", "middle_east", "madagascar"]],
	["congo", ["east_africa", "north_africa", "south_africa"]],
	["south_africa", ["congo", "east_africa", "madagascar"]],
	["madagascar", ["south_africa", "east_africa"]],
	["ural", ["ukraine", "siberia", "china", "afghanistan"]],
	["siberia", ["ural", "yakursk", "irkutsk", "mongolia", "china"]],
	["yakursk", ["siberia", "kamchatka", "irkutsk"]],
	["kamchatka", ["yakursk", "irkutsk", "mongolia", "japan", "alaska"]],
	["irkutsk", ["yakursk", "kamchatka", "mongolia", "china", "siberia"]],
	["mongolia", ["siberia", "irkutsk", "kamchatka", "japan", "china"]],
	["japan", ["kamchatka", "mongolia"]],
	["afghanistan", ["ural", "ukraine", "middle_east", "india", "china"]],
	["china", ["siberia", "mongolia", "afghanistan", "india", "siam", "ural"]],
	["middle_east", ["ukraine", "southern_europe", "egypt", "east_africa", "india", "afghanistan"]],
	["india", ["middle_east", "afghanistan", "china", "siam"]],
	["siam", ["india", "china", "indonesia"]],
	["indonesia", ["siam", "new_guinea", "western_australia"]],
	["new_guinea", ["indonesia", "western_australia", "eastern_australia"]],
	["western_australia", ["indonesia", "new_guinea", "eastern_australia"]],
	["eastern_australia", ["new_guinea", "western_australia"]]
];

export const continentBonuses: Continent[] = [
	{name: "Africa", bonus: 3, territories: ["north_africa", "egypt", "east_africa", "congo", "south_africa", "madagascar"]},
	{name: "Australia", bonus: 2, territories: ["indonesia", "new_guinea", "western_australia", "eastern_australia"]},
	{name: "South America", bonus: 2, territories: ["venezuela", "peru", "brazil", "argentina"]},
	{
		name: "North America",
		bonus: 5,
		territories: [
			"alaska",
			"northwest_territory",
			"greenland",
			"alberta",
			"ontario",
			"quebec",
			"western_united_states",
			"eastern_united_states",
			"central_america"
		]
	},
	{
		name: "Europe",
		bonus: 5,
		territories: ["iceland", "scandinavia", "ukraine", "great_britain", "northern_europe", "western_europe", "southern_europe"]
	},
	{
		name: "Asia",
		bonus: 7,
		territories: [
			"ural",
			"siberia",
			"yakursk",
			"kamchatka",
			"irkutsk",
			"mongolia",
			"japan",
			"afghanistan",
			"china",
			"middle_east",
			"india",
			"siam"
		]
	}
];
export const allTerritories = Object.keys(Object.fromEntries(allBorders)) as Territory[];
export const players = 2;
export const playerColors = ["#9651fd", "#f3bd28", "#72cbaf", "#ff006e", "#3a86ff", "#fb5607", "#BADA55"];

export const playerNames = ["Katharina die Große", "Julius Caesar", "Napoleon Bonaparte", "Genghis Khan", "König Tamara", "Cleopatra"];
export const initialTroopsPerPlayer = Math.floor(allTerritories.length / players) * 4;

export const diceInterval: Interval = [1, 6];
