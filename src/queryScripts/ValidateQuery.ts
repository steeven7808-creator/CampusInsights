import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import {MetaQuery} from "../models/IQuery";
import {validateBody} from "./ValidateBody";
import {doesDatasetIDExist} from "../controller/DiskUtil";
import {validateOptions} from "./ValidateOptions";
import {validateTransformations} from "./ValidateTransformations";

let idStringList: string[] = [];
let colKeys: string[];
let groupKeys: string[];
let applyKeys: string[];
let predictedKind: string;

// if query is valid, returns id_string, else false
export function validateQuery(query: object): MetaQuery {
	// reset the idStringList whenever we validate a new query.
	idStringList = [];
	// reset predictedKind whenever we validate a new query.
	predictedKind = "";
	validateRootStructure(query);
	validateBody(query);
	colKeys = validateOptions(query);
	if (Object.keys(query).length === 3) {
		let transformationKeys = validateTransformations(query);
		groupKeys = transformationKeys[0];
		applyKeys = transformationKeys[1];
		for (let colKey of colKeys) {
			if (colKey.includes("_")) {
				if (!groupKeys.includes(colKey)) {
					throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
				}
			} else {
				if (!applyKeys.includes(colKey)) {
					throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
				}
			}
		}
	}
	let idString: string = validateIDs(query);
	return {
		id: idString,
		kind: predictedKind as InsightDatasetKind,
		query: query,
	};
}

// check if BODY (WHERE), OPTIONS, and optionally TRANSFORMATIONS are the only keys present
function validateRootStructure(query: object) {
	let rootKeys = Object.keys(query);
	let numKeys = rootKeys.length;
	if (numKeys < 1) {
		throw new InsightError("Invalid query string");
	}
	if (rootKeys[0] !== "WHERE") {
		throw new InsightError("Missing WHERE");
	}
	if (numKeys < 2 || rootKeys[1] !== "OPTIONS") {
		throw new InsightError("Missing OPTIONS");
	}
	if (numKeys === 2) {
		return;
	}
	if (numKeys !== 3 || rootKeys[2] !== "TRANSFORMATIONS") {
		throw new InsightError("Excess keys in query");
	}
}

const Operators = ["LT", "GT", "EQ", "IS", "MAX", "MIN", "AVG", "SUM", "COUNT"];
const OperatorTypeMap: {[index: string]: number} = {
	LT: 0,
	GT: 0,
	EQ: 0,
	IS: 1,
	MAX: 0,
	MIN: 0,
	AVG: 0,
	SUM: 0,
	COUNT: 2,
};
const SectionsMathFields = ["avg", "pass", "fail", "audit", "year"];
const SectionsStringFields = ["dept", "id", "instructor", "title", "uuid"];
const RoomsMathFields = ["lat", "lon", "seats"];
const RoomsStringFields = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];

const SectionsFields = SectionsMathFields.concat(SectionsStringFields);
const RoomsFields = RoomsMathFields.concat(RoomsStringFields);

const MathFields = SectionsMathFields.concat(RoomsMathFields);
const StringFields = SectionsStringFields.concat(RoomsStringFields);
const AllFields = MathFields.concat(StringFields);
// lol this is so hacky but whatever
const fields = [MathFields, StringFields, AllFields];
const oppositeFields = [StringFields, MathFields, []];
// takes operator (oneof GT, LT, EQ, IS) and the qkey (idstring_field) and validates
// a valid qkey must be formatted properly, and field must be correct type based on operator
// updates the idStringList
export function validateQueryKey(fieldKey: string, qkey: string) {
	const regex = /^[^_]+_[^_]+$/g;
	if (!regex.test(qkey)) {
		throw new InsightError("Invalid key " + qkey + " in " + fieldKey);
	}

	let split = qkey.split("_");
	if (split.length !== 2) {
		throw new InsightError("Invalid key " + qkey + " in " + fieldKey);
	}
	let id = split[0];
	idStringList.push(id);
	let field = split[1];
	if (!AllFields.includes(field)) {
		throw new InsightError("Invalid key " + qkey + " in " + fieldKey);
	}
	if (predictedKind === "") {
		predictedKind = SectionsFields.includes(field) ? InsightDatasetKind.Sections : InsightDatasetKind.Rooms;
	} else {
		let currKind = SectionsFields.includes(field) ? InsightDatasetKind.Sections : InsightDatasetKind.Rooms;
		if (currKind !== predictedKind) {
			throw new InsightError("Invalid key " + qkey + " in " + fieldKey);
		}
	}
	// if fieldKey is in operators, we must validate the fieldType
	if (Operators.includes(fieldKey)) {
		let operatorType = OperatorTypeMap[fieldKey];
		if (fields[operatorType].includes(field)) {
			return;
		} else if (oppositeFields[operatorType].includes(field)) {
			throw new InsightError("Invalid key type in " + fieldKey);
		}
	}
}

// check that all id_strings in query are the same
// if same, return the id, else throw InsightError
function validateIDs(query: object): string | never {
	// is this possible to reach? how can you have a query that doesn't reference a dataset
	if (idStringList.length === 0) {
		throw new InsightError("something is definitely wrong if you got this error");
	}
	let idString = idStringList[0];
	if (idStringList.every((id) => id === idString)) {
		if (!doesDatasetIDExist(idString)) {
			throw new InsightError(`Referenced dataset "${idString}" not added yet`);
		}
		return idString;
	} else {
		throw new InsightError("Cannot query more than one dataset");
	}
}
