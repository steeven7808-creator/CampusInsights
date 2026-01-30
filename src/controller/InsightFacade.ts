import JSZip from "jszip";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import fs from "fs-extra";
import {DatasetModel, Header, RoomDatasetModel, SectionDatasetModel} from "../models/IModel";
import {handleQuery} from "../queryScripts/PerformQuery";
import * as DiskUtil from "./DiskUtil";
import {sectionLogicAndOutput} from "./SectionDatasetUtil";
import {roomLogicAndOutput} from "./RoomDatasetUtil";
import {retrieveDatasetModel} from "./CommonDatasetUtil";
import * as DatasetUtil from "./DatasetUtil";
import {InsightDatasetClass} from "./InsightDatasetClass";
import {PERSISTENT_DIR} from "./DiskUtil";
// import * as DatasetProcessor from "./DatasetProcessor";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		// console.log("InsightFacadeImpl::init()");
	}

	// public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
	// 	// id data validation
	// 	if (!id || /^\s*$/.test(id) || id.includes("_")) {
	// 		return Promise.reject(new InsightError("Invalid ID"));
	// 	}
	// 	// check if id already exists in dataset
	// 	if (DiskUtil.doesDatasetIDExist(id)) {
	// 		return Promise.reject(new InsightError("ID already exists"));
	// 	}
	// 	// checks if zip content exists
	// 	if (!content) {
	// 		return Promise.reject(new InsightError("Content was empty"));
	// 	}
	// 	const zip = new JSZip();
	// 	return zip
	// 		.loadAsync(content, {base64: true})
	// 		.then((data) => {
	// 			// data validation
	// 			if (!data) {
	// 				throw new InsightError("Invalid Dataset: Missing data directory");
	// 			}
	// 			return data;
	// 		})
	// 		.then((data) => {
	// 			if (kind === InsightDatasetKind.Sections) {
	// 				// return an array of sections from content JSON if kind is Sections
	// 				return sectionLogicAndOutput(data, id, kind);
	// 			} else if (kind === InsightDatasetKind.Rooms) {
	// 				// return an array of rooms from content JSON if kind is Rooms
	// 				return roomLogicAndOutput(data, id, kind);
	// 			}
	// 			throw new InsightError("Invalid Dataset Kind");
	// 		})
	// 		.catch((error) => {
	// 			throw new InsightError(error.message);
	// 		});
	// }

	// /*
	//  validate ID
	//
	//  */
	// public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
	// 	// id must be non-null, contain non-whitespace, and not contain underscore
	// 	if (!id || !id.trim() || id.includes("_")) {
	// 		return Promise.reject(new InsightError("Invalid ID"));
	// 	}
	// 	// check if id already exists in dataset
	// 	if (DiskUtil.doesDatasetIDExist(id)) {
	// 		return Promise.reject(new InsightError("Dataset ID already exists"));
	// 	}
	// 	// checks if zip content exists
	// 	if (!content) {
	// 		return Promise.reject(new InsightError("Content parameter is empty"));
	// 	}
	// 	const zip = new JSZip();
	// 	return zip
	// 		.loadAsync(content, {base64: true})
	// 		.then((data) => {
	// 			return DatasetProcessor.processFileContents(id, zip, kind);
	// 		})
	// 		.catch((error) => {
	// 			throw new InsightError(error.message);
	// 		});
	// }

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let dataset: InsightDatasetClass;
		try {
			dataset = DatasetUtil.createInsightDataset(id, kind, 0);
		} catch (err) {
			return Promise.reject(err);
		}
		return dataset.addData(content)
			.then(() => {
				return dataset.writeToDisk();
			})
			.then(() => {
				return DiskUtil.retrieveAllDatasetIds();
			})
			.catch((err) => {
				throw err;
			});
	}

	public removeDataset(id: string): Promise<string> {
		try {
			DatasetUtil.validateID(id, true);
			DiskUtil.removeDataset(id);
			return Promise.resolve(id);
		} catch (err) {
			return Promise.reject(err);
		}
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return handleQuery(query);
	}

	// TODO: enable mix and match if the type checking proves to be problematic
	public listDatasets(): Promise<InsightDataset[]> {
		if (!fs.existsSync(`${PERSISTENT_DIR}dataset_index.json`)) {
			return Promise.resolve([]);
		}
		let indexString = fs.readFileSync(`${PERSISTENT_DIR}dataset_index.json`, {encoding: "utf8"});
		return Promise.resolve(JSON.parse(indexString));
	}
}
