import { assign } from "xstate";
import { SelectTerritoryEvent } from "../config/types.ts";

export const selectTerritory = assign({
	fromTerritory: ({ event }: { event: SelectTerritoryEvent }) => {
		console.log(">> fromTerritory", event.territory);
		return event.territory;
	}
});
