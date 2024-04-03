import { assign } from "xstate";
import { SelectTerritoryEvent } from "../config/types.ts";

export const setFromTerritory = assign({
	fromTerritory: ({ event }: { event: SelectTerritoryEvent }) => {
		console.log(">> attacker", event.territory);
		return event.territory;
	}
})