import {assign} from "xstate";
import {Context, Territory, RiskEvent} from "../config/types.ts";
import type {EventObject} from "xstate";

export const reinforceTroops = assign<Context, RiskEvent, any, EventObject, never>({
	ownership: ({context, event}) => {
		const troops = event.troops || 0;
		if (!troops) new Error("No troops to reinforce with");
		const ownership = {...context.ownership};
		ownership[context.fromTerritory as Territory].troops -= troops;
		ownership[context.toTerritory as Territory].troops += troops;
		console.log(">> ownership", ownership);
		return ownership;
	}
});
