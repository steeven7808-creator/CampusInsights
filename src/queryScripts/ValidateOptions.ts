import {InsightError} from "../controller/IInsightFacade";
import {validateQueryKey} from "./ValidateQuery";

/*
 "OPTIONS": {
 	"COLUMNS": [
 		"XXX_XXX",
 		"XXX_XXX"
 	],
 	"ORDER": "XXX_XXX"
 }
 Returns an array of the keys in COLUMNS
*/
export function validateOptions(query: object) {
	// TODO: redundant check, suppresses warnings when directly indexing query by "OPTIONS"
	if (!("OPTIONS" in query)) {
		throw new InsightError("Missing OPTIONS");
	}
	let options = query["OPTIONS"] as {[index: string]: string[] | string};
	if (!("COLUMNS" in options)) {
		throw new InsightError("OPTIONS missing COLUMNS");
	}
	let colKeys = options["COLUMNS"] as string[];
	if (!Array.isArray(colKeys) || colKeys.length === 0) {
		throw new InsightError("COLUMNS must be a non-empty array");
	}
	validateColumns(colKeys);

	// numKeys is number of keys in Options object.
	let numKeys = Object.keys(options).length;
	// 1 key means we should only have a COLUMN object
	if (numKeys === 1) {
		return colKeys;
	}
	// 2 keys means we should only have a COLUMN and ORDER object
	if ((numKeys === 2 && !("ORDER" in options)) || numKeys > 2) {
		throw new InsightError("Invalid keys in OPTIONS");
	}
	validateOrder(options["ORDER"], colKeys);
	return colKeys;
}

// TODO: need to check presence of colKeys in group and apply
function validateColumns(colKeys: string[]) {
	for (let colKey of colKeys) {
		// intelliJ wrongly thinks this check is unnecessary
		if (typeof colKey !== "string") {
			throw new InsightError("Invalid query string");
		}
		// TODO: could use a regex check instead?
		if (colKey.includes("_")) {
			validateQueryKey("COLUMNS", colKey);
		}
	}
}

// {[index: string]: string | string[]} | string
function validateOrder(order: unknown, colKeys: string[]) {
	if (typeof order === "string") {
		if (order.includes("_")) {
			validateQueryKey("ORDER", order);
		}
		if (!colKeys.includes(order)) {
			throw new InsightError("ORDER key must be in COLUMNS");
		}
	} else if (typeof order === "object" && order !== null) {
		if (!("dir" in order)) {
			throw new InsightError("ORDER missing 'dir' key");
		}
		let direction = order["dir"];
		if (typeof direction !== "string" || !(direction === "UP" || direction === "DOWN")) {
			throw new InsightError("Invalid ORDER direction");
		}
		if (!("keys" in order)) {
			throw new InsightError("ORDER missing 'keys' key");
		}
		let orderKeys = order["keys"];
		if (!Array.isArray(orderKeys) || orderKeys.length === 0) {
			throw new InsightError("ORDER keys must be a non-empty array");
		}
		for (let orderKey of orderKeys) {
			if (!colKeys.includes(orderKey)) {
				throw new InsightError("All ORDER keys must be in COLUMNS");
			}
			// we will validate all colKeys, so if all orderKeys are in colKeys, they will get validated eventually
		}
	}
}
