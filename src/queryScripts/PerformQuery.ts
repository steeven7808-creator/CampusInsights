import {InsightDatasetKind, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
import {retrieveDataset} from "../controller/DiskUtil";
import {mapColumns, orderRows, passesQuery, processQueryToAST, transformResult} from "./ExecuteQuery";
import {QueryASTNode} from "../models/QueryASTNode";
import {validateQuery} from "./ValidateQuery";
import {MetaQuery} from "../models/IQuery";
import {Dataset, InsightData, RoomData, SectionData} from "../models/IModel";
import {SectionClass} from "../models/ISection";
import {RoomClass} from "../models/IRoom";

export function handleQuery(query: unknown): Promise<InsightResult[]> {
	let currDataset: Dataset;
	if (!isJSON(query)) {
		return Promise.reject(new InsightError("Invalid query string"));
	}

	return Promise.resolve(query as object)
		.then((queryToValidate) => {
			return validateQuery(queryToValidate);
		})
		.then((metaQuery: MetaQuery) => {
			let validQuery = metaQuery.query;
			currDataset = retrieveDataset(metaQuery.id);
			if (metaQuery.kind !== currDataset.kind) {
				throw new InsightError("Used " + metaQuery.kind + " query fields on " + currDataset.kind + " dataset.");
			}
			// construct tree and process the query
			return Promise.resolve(executeQuery(validQuery, currDataset));
		})
		.catch((error) => {
			return Promise.reject(error);
		});
}

// returns true if input looks like valid JSON
export function isJSON(input: unknown): boolean {
	// checks if input is valid JSON
	// arrays are objects, so we must ensure that input is not an array
	return input !== null && input !== undefined && typeof input === "object" && !Array.isArray(input);
}


function executeQuery(inputQuery: any, currDataset: Dataset) {
	let rawResult = [];
	let queryTree: QueryASTNode = processQueryToAST(inputQuery["WHERE"]);
	let dataArr: InsightData[] | undefined;
	// if (currDataset.kind === InsightDatasetKind.Sections) {
	// 	dataArr = currDataset.data as SectionClass[];
	// } else if (currDataset.kind === InsightDatasetKind.Rooms) {
	// 	dataArr = currDataset.data as RoomClass[];
	// }
	// if (dataArr == null) {
	// 	throw new InsightError("invalid kind");
	// }
	// for (let entry of dataArr) {
	// 	if (passesQuery(entry, queryTree)) {
	// 		rawResult.push(entry);
	// 	}
	// }
	if (currDataset.kind === InsightDatasetKind.Rooms) {
		let roomDataset = currDataset;
		for (let room of roomDataset.data) {
			let currRoom = new RoomClass(room);
			if (passesQuery(currRoom, queryTree)) {
				rawResult.push(currRoom);
			}
		}
	} else if (currDataset.kind === InsightDatasetKind.Sections) {
		let sectionDataset = currDataset;
		// iterate through section list and add sections to unprocessed result list that pass query
		for (let section of sectionDataset.data) {
			let currSection = new SectionClass(section);
			if (passesQuery(currSection, queryTree)) {
				rawResult.push(currSection);
			}
		}
	}

	if (inputQuery["TRANSFORMATIONS"]) {
		rawResult = transformResult(inputQuery["TRANSFORMATIONS"], rawResult);
	}

	// check if result > 5000 after transformation is done now
	if (rawResult.length > 5000) {
		throw new ResultTooLargeError(
			"The result is too big. " + "Only queries with a maximum of 5000 results are supported."
		);
	}

	let processedResult = mapColumns(rawResult, inputQuery["OPTIONS"]["COLUMNS"]);

	if (inputQuery["OPTIONS"]["ORDER"]) {
		return orderRows(processedResult, inputQuery["OPTIONS"]["ORDER"]);
	} else {
		return processedResult;
	}
}
