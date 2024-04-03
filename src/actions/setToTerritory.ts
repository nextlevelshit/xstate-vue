import {assign} from "xstate";
import {SelectTerritoryEvent} from "../config/types.ts";

export const setToTerritory = assign({
	toTerritory: ({event}: {event: SelectTerritoryEvent}) => {
		console.log(">> target", event.territory);
		return event.territory;
	}
});
