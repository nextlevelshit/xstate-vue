import {assign} from "xstate";
import {Context, RiskEvent, Territory} from "../config/types.ts";
import type {EventObject} from "xstate";

export const setToTerritory = assign<Context, RiskEvent, any, EventObject, never>({
	toTerritory: ({event}) => {
		console.log(">> target", event.territory);
		return event.territory as Territory;
	}
});
