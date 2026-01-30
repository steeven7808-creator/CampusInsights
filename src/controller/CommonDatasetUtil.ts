import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {RoomClass} from "../models/IRoom";
import {RoomDatasetModel, SectionDatasetModel} from "../models/IModel";
import fs from "fs-extra";
import {Section, SectionClass} from "../models/ISection";
import {retrieveAllDatasetIds} from "./DiskUtil";

// Type guard for Room
function isRoom(obj: any): obj is RoomClass {
	return obj && "address" in obj;
}

// Type guard for Section
function isSection(obj: any): obj is Section {
	return obj && "Course" in obj;
}

export function outputDataset(id: string, kind: InsightDatasetKind, arr: any[]): string[] {
	let newDataset;

	if (arr.length === 0) {
		throw new InsightError("Empty dataset");
	}

	if (kind === InsightDatasetKind.Rooms) {
		newDataset = {
			id: id,
			kind: kind,
			numRows: arr.length,
			room: arr,
		} as RoomDatasetModel;
	} else if (kind === InsightDatasetKind.Sections) {
		newDataset = {
			id: id,
			kind: kind,
			numRows: arr.length,
			section: arr.map((section: any) => new SectionClass(section)),
		} as SectionDatasetModel;
	} else {
		throw new InsightError("Invalid dataset type");
	}

	fs.outputFileSync(`./data/${id}.json`, JSON.stringify(newDataset, null, 4));
	// const datasetArr = retrieveDatasetModel<typeof newDataset>();
	// return datasetArr.map((dataset: any) => dataset.id);
	return retrieveAllDatasetIds();
}

export function retrieveDatasetModel<T>(): T[] {
	try {
		const files = fs.readdirSync("./data");
		const datasetArr: T[] = [];
		files.forEach((file) => {
			if (file.endsWith(".json")) {
				const data = fs.readFileSync(`./data/${file}`, "utf8");
				const dataset: T = JSON.parse(data);
				datasetArr.push(dataset);
			}
		});
		return datasetArr;
	} catch (err) {
		return [];
	}
}
