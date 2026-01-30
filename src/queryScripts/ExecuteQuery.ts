import {SectionClass} from "../models/ISection";
import {QueryASTNode} from "../models/QueryASTNode";
import {InsightResult} from "../controller/IInsightFacade";
import {RoomClass} from "../models/IRoom";
import Decimal from "decimal.js";

export function processQueryToAST(queryItem: any) {
	if (Object.keys(queryItem).length === 0) {
		// node with dummy key and no children should automatically pass PassesQuery
		return new QueryASTNode("no_filter", []);
	}
	// at top level key[0] WHERE has one key and value
	let queryItemKey = Object.keys(queryItem)[0];
	let itemChildren = queryItem[queryItemKey];

	/* if the current query item has a value that isn't a list we've reached our base case (comparison with key : value)
	   else we iterate through list to make a new node for each child */
	if (queryItemKey === "NOT") {
		let notNode = new QueryASTNode(queryItemKey, []);
		let childNode = processQueryToAST(itemChildren);
		notNode.addChild(childNode);
		return notNode;
	} else if (!Array.isArray(itemChildren)) {
		// make final node with key:value, add to list of MCOMPARISON/SCOMPARISON node
		let leafItemKey = Object.keys(itemChildren)[0];
		let leaf = new QueryASTNode(leafItemKey, itemChildren[leafItemKey]);
		return new QueryASTNode(queryItemKey, [leaf]);
	} else {
		let currRoot = new QueryASTNode(queryItemKey, []);
		for (let childItem of itemChildren) {
			currRoot.addChild(processQueryToAST(childItem));
		}
		return currRoot;
	}
}

export function passesQuery(currClass: SectionClass | RoomClass, query: QueryASTNode): boolean {
	// if class doesn't pass any of the query execution return false; will only return true if query works
	let includeClass = false;
	let queryNodeKey = query.key;
	let queryChildren = query.children as QueryASTNode[];

	switch (queryNodeKey) {
		case "AND":
			includeClass = true;
			for (const child of query.children as QueryASTNode[]) {
				includeClass = includeClass && passesQuery(currClass, child);
			}
			return includeClass;
		case "OR":
			for (const child of queryChildren) {
				includeClass = includeClass || passesQuery(currClass, child);
			}
			return includeClass;
		case "LT":
			return passesMComparator(currClass, queryChildren[0], "LT");
		case "GT":
			return passesMComparator(currClass, queryChildren[0], "GT");
		case "EQ":
			return passesMComparator(currClass, queryChildren[0], "EQ");
		case "NOT": {
			return !passesQuery(currClass, queryChildren[0]);
		}
		case "IS": {
			return matchesSField(currClass, queryChildren[0]);
		}
		case "no_filter": {
			return true;
		}
		default:
			return includeClass;
	}
}

export function mapColumns(rawResult: any, columns: string[]) {
	let transformedResult: InsightResult[] = [];
	for (const currClass of rawResult) {
		let transformedClass: InsightResult = {};
		for (const column of columns) {
			if (!(column in transformedClass)) {
				let fieldName = column.split("_")[1];
				if (fieldName) {
					transformedClass[column] = currClass.getField(fieldName);
				} else {
					transformedClass[column] = currClass[column];
				}
			}
		}
		transformedResult.push(transformedClass);
	}
	return transformedResult;
}

// TODO: fix sorting
export function orderRows(result: InsightResult[], order: any): InsightResult[] {
	let orderKeys: string[];
	if (typeof order === "string") {
		orderKeys = [order];
	} else {
		orderKeys = order["keys"];
	}

	let less = -1;
	let greater = 1;

	if (order["dir"] && order["dir"] === "DOWN") {
		less *= -1;
		greater *= -1;
	}

	// for(let key of orderKeys) {
	// 	directedResult = directedResult.sort((class1, class2) => {
	// 		if (class1[key] < class2[key]) {
	// 			return less;
	// 		} else if (class1[key] > class2[key]) {
	// 			return greater;
	// 		} else {
	// 			return 0;
	// 		}
	// 	});
	// }

	return result.sort((class1, class2) => {
		for (let key of orderKeys) {
			// will return something if a tiebreak for the key exists
			if (class1[key] < class2[key]) {
				return less;
			} else if (class1[key] > class2[key]) {
				return greater;
			}
		}
		return 1;
	});
}

export function transformResult(inputQueryElement: any, processedResult: any): InsightResult[] {
	let transformedResult: Map<string, any[]> = groupResult(inputQueryElement["GROUP"], processedResult);
	return applyResult(inputQueryElement["APPLY"], transformedResult);
}

// HELPER FUNCTIONS

function passesMComparator(currClass: SectionClass | RoomClass, mComparison: QueryASTNode, mComparator: string) {
	let fieldName = mComparison.key.split("_")[1];
	let mValue: number = mComparison.children as number;
	let classField: number = 0;
	if (currClass.getField) {
		classField = currClass.getField(fieldName) as number;
	}
	switch (mComparator) {
		case "LT":
			return classField < mValue;
		case "GT":
			return classField > mValue;
		case "EQ":
			return classField === mValue;
		default:
			return true;
	}
}

function matchesSField(currClass: SectionClass | RoomClass, sComparison: QueryASTNode) {
	let fieldName = sComparison.key.split("_")[1];
	let sValue: string = sComparison.children as string;
	let field: string = "";
	if (currClass.getField) {
		field = currClass.getField(fieldName) as string;
	}

	if (sValue === "*" || sValue === "**") {
		return true;
	}

	if (field === "" && sValue !== "") {
		return false;
	}

	// sValue isn't empty when removing asterisk
	if (sValue.startsWith("*") && sValue.endsWith("*")) {
		return field.includes(sValue.slice(1, -1));
	} else if (sValue.startsWith("*")) {
		return field.endsWith(sValue.slice(1));
	} else if (sValue.endsWith("*")) {
		return field.startsWith(sValue.slice(0, -1));
	} else {
		return sValue === field;
	}
}

function groupResult(groupKeys: any, processedResult: SectionClass[] | RoomClass[]) {
	let mappedResult: Map<string, any[]> = new Map();
	for (let result of processedResult) {
		let mapGroupKey = [];
		for (let groupKey of groupKeys) {
			let fieldName = groupKey.split("_")[1];
			mapGroupKey.push(result.getField?.(fieldName));
		}
		let mapKey = mapGroupKey.toString();
		if (mappedResult.has(mapKey)) {
			mappedResult.get(mapKey)?.push(result);
		} else {
			let newGroupList = [result];
			mappedResult.set(mapKey, newGroupList);
		}
	}
	return mappedResult;
}

function applyResult(applyRuleList: any, groupedResult: Map<string, any[]>) {
	let resultMapKeys = groupedResult.keys();
	let appliedResult: InsightResult[] = [];
	let aggregatedResult: InsightResult = {};
	for (let groupKey of resultMapKeys) {
		let resultGroup: any[] = groupedResult.get(groupKey) as any[];

		// all have the same group keys so pick first one
		aggregatedResult = resultGroup[0] as InsightResult;

		for (let applyRule of applyRuleList) {
			let applyKey = Object.keys(applyRule)[0];
			let applyKeyValue = applyRule[applyKey];
			let applyToken = Object.keys(applyKeyValue)[0];
			let keyField = applyKeyValue[applyToken].split("_")[1];

			aggregatedResult[applyKey] = applyCurrRule(resultGroup, applyToken, keyField);
		}
		appliedResult.push(aggregatedResult);
	}
	return appliedResult;
}

// Apply Helper Functions
function applyCurrRule(resultGroup: RoomClass[] | SectionClass[], applyToken: string, keyField: any) {
	switch (applyToken) {
		case "MAX":
			return getMaxResult(resultGroup, keyField);
		case "MIN":
			return getMinResult(resultGroup, keyField);
		case "AVG":
			return getAvgResult(resultGroup, keyField);
		case "SUM":
			return sumGroupKeyField(resultGroup, keyField);
		case "COUNT":
			return countUniqueFieldOccurrence(resultGroup, keyField);
		default:
			return 0;
	}
}

function getMaxResult(resultGroup: RoomClass[] | SectionClass[], keyField: string) {
	let maxResult = Number(resultGroup[0].getField?.(keyField));
	for (let result of resultGroup) {
		let fieldValue = Number(result.getField?.(keyField));
		if (maxResult < fieldValue) {
			maxResult = fieldValue;
		}
	}
	return maxResult;
}

function getMinResult(resultGroup: RoomClass[] | SectionClass[], keyField: string) {
	let minResult = Number(resultGroup[0].getField?.(keyField));
	for (let result of resultGroup) {
		let fieldValue = Number(result.getField?.(keyField));
		if (minResult > fieldValue) {
			minResult = fieldValue;
		}
	}
	return minResult;
}

function getAvgResult(resultGroup: RoomClass[] | SectionClass[], keyField: string) {
	let sum = new Decimal(0);
	for (let result of resultGroup) {
		sum = sum.add(new Decimal(Number(result.getField?.(keyField))));
	}
	let avg = sum.toNumber() / resultGroup.length;
	return Number(avg.toFixed(2));
}

function sumGroupKeyField(resultGroup: RoomClass[] | SectionClass[], keyField: string) {
	let sum = new Decimal(0);
	for (let result of resultGroup) {
		sum = sum.add(new Decimal(Number(result.getField?.(keyField))));
	}
	return Number(sum.toFixed(2));
}

function countUniqueFieldOccurrence(resultGroup: RoomClass[] | SectionClass[], keyField: any) {
	// prevents duplicates
	let uniqueFields = new Set();
	for (let result of resultGroup) {
		uniqueFields.add(result.getField?.(keyField));
	}
	return uniqueFields.size;
}
