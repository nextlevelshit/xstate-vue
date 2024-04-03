import { assign } from "xstate";
import { Context, SelectTroopsEvent, Territory } from "../config/types.ts";

export const reinforceTroops = assign({
	ownership: ({ context, event }: { context: Context; event: SelectTroopsEvent }) => {
		const ownership = { ...context.ownership };
		ownership[context.fromTerritory as Territory].troops -= event.troops;
		ownership[context.toTerritory as Territory].troops += event.troops;
		console.log(">> ownership", ownership);
		return ownership;
	}
});
