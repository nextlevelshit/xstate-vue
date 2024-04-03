import { Context, SelectTroopsEvent } from "../config/types.ts";

export const startCombatMode = ({ context, event }: { context: Context; event: SelectTroopsEvent }) => {
	console.log("Attacking", context.fromTerritory, "from", event.territory);
};
