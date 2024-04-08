import {assign} from "xstate";
import {Territory, Context, RiskEvent} from "../config/types.ts";
import type {EventObject} from "xstate";

export const setFromTerritory = assign<Context, RiskEvent, any, EventObject, never>({
	fromTerritory: ({event}) => {
		console.log(">> tromTerritory", event.territory);
		return event.territory as Territory;
	}
});
