import {InsightError} from "../controller/IInsightFacade";
import {validateQueryKey} from "./ValidateQuery";

let groupKeys: string[];
let applyKeys: string[];
export function validateTransformations(query: object) {
	// clear key arrays when validating a new query
	groupKeys = [];
	applyKeys = [];
	if (!("TRANSFORMATIONS" in query)) {
		throw new InsightError("Excess keys in query");
	}
	let transformations = query["TRANSFORMATIONS"];
	if (typeof transformations !== "object" || transformations === null || Array.isArray(transformations)) {
		throw new InsightError("Invalid query string");
	}
	let transformationKeys = Object.keys(transformations);
	if (!("GROUP" in transformations)) {
		throw new InsightError("TRANSFORMATIONS missing GROUP");
	}
	if (!("APPLY" in transformations)) {
		throw new InsightError("TRANSFORMATIONS missing APPLY");
	}
	if (transformationKeys.length > 2) {
		throw new InsightError("Extra keys in TRANSFORMATIONS");
	}

	let group = transformations["GROUP"];
	if (!Array.isArray(group) || group.length === 0) {
		throw new InsightError("GROUP must be a non-empty array");
	}
	validateGroup(group);
	let apply = transformations["APPLY"];
	if (!Array.isArray(apply)) {
		throw new InsightError("APPLY must be an array");
	}
	validateApply(apply);
	return [groupKeys, applyKeys];
}

function validateGroup(group: string[]) {
	for (let key of group) {
		validateQueryKey("GROUP", key);
		groupKeys.push(key);
	}
}

function validateApply(apply: object[]) {
	if (apply.length === 0) {
		return;
	}
	for (let applyRule of apply) {
		validateApplyRule(applyRule);
	}
}

const applyTokens = ["MAX", "MIN", "AVG", "SUM", "COUNT"];
/*
TODO: contains big chunk of duplicate code. abstractValidate() is a weak attempt at extracting this functionality,
but causes some ts lint errors or something.
 */
function validateApplyRule(applyRule: object) {
	if (typeof applyRule !== "object" || applyRule === null || Array.isArray(applyRule)) {
		throw new InsightError("Invalid query string");
	}
	let applyRuleKeys = Object.keys(applyRule);
	let numKeys = applyRuleKeys.length;
	if (numKeys !== 1) {
		throw new InsightError("Apply rule should only have 1 key, has " + numKeys);
	}
	let applyAlias = applyRuleKeys[0];
	if (applyKeys.includes(applyAlias)) {
		throw new InsightError("Duplicate APPLY key " + applyAlias);
	}
	let applyBody = Object.values(applyRule)[0];
	if (typeof applyBody !== "object" || applyBody === null || Array.isArray(applyBody)) {
		throw new InsightError("Invalid query string");
	}
	let applyBodyKeys = Object.keys(applyBody);
	numKeys = applyBodyKeys.length;
	if (numKeys !== 1) {
		throw new InsightError("Apply body should only have 1 key, has " + numKeys);
	}
	let applyToken: string = applyBodyKeys[0];
	let applyKey: string = applyBody[applyToken];
	const regex = /^[^_]+$/g;
	if (!regex.test(applyAlias)) {
		throw new InsightError("Cannot have underscore in applyKey");
	}
	if (!applyTokens.includes(applyToken)) {
		throw new InsightError("Invalid transformation operator");
	}
	// TODO: verify that applyKey type matches applyToken type
	validateQueryKey(applyToken, applyKey);
	applyKeys.push(applyAlias);
}
// returns singular key of object being validated
function abstractValidate(toValidate: object, type: string) {
	if (!(typeof toValidate !== "object") || toValidate === null || Array.isArray(toValidate)) {
		throw new InsightError("Invalid query string");
	}
	let toValidateKeys = Object.keys(toValidate);
	let numKeys = toValidateKeys.length;
	if (numKeys !== 1) {
		throw new InsightError("Apply " + type + " should only have 1 key, has " + numKeys);
	}
	return toValidateKeys[0];
}
