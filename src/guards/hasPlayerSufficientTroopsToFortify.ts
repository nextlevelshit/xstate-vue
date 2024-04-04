import {SelectTroopsEvent, Context} from "../config/types.ts";

export const hasPlayerSufficientTroopsToFortify = ({context, event}: {context: Context; event: SelectTroopsEvent}) => {
	const isValid = context.fromTerritory && context.ownership[context.fromTerritory].troops > 1;
	console.log(">> hasPlayerSufficientTroopsToFortify", isValid);
	return isValid;
}