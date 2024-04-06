import {Context, SelectTroopsEvent} from "../config/types.ts";

export const fortifyTroops = ({context, event}: {context: Context; event: SelectTroopsEvent}) => {
	console.log("Fortifying", context.fromTerritory, "with", event.troops, "from", context.toTerritory);
	context.fromTerritory && (context.ownership[context.fromTerritory].troops -= event.troops);
	context.toTerritory && (context.ownership[context.toTerritory].troops += event.troops);
	context.fromTerritory = context.toTerritory;
	context.toTerritory = null;
	context.attackerTroops = 0;
};
