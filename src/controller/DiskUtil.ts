import fs from "fs-extra";
import {Dataset, Header, InsightData, RoomDatasetModel, SectionDatasetModel} from "../models/IModel";
import {InsightError, NotFoundError} from "./IInsightFacade";

export const PERSISTENT_DIR = "./data/";

// TODO: make this async
export function doesDatasetIDExist(id: string): boolean {
	return fs.existsSync(PERSISTENT_DIR + id + ".json");
}

// TODO: make this async
// retrieve dataset with given ID
export function retrieveDataset(id: string): Dataset {
	const data = fs.readFileSync(PERSISTENT_DIR + id + ".json", "utf8");
	return JSON.parse(data);
}

export function retrieveAllDatasetIds(): string[] {
	let ids: string[] = [];
	fs.readdirSync(PERSISTENT_DIR).forEach((file) => {
		let id = file.split(".")[0];
		if (!id.includes("dataset_index")) {
			ids.push(file.split(".")[0]);
		}
	});
	return ids;
}

export function updateDatasetIndex(header: Dataset | Header) {
	let toDisk = JSON.stringify([header]);
	// TODO: this could go into DiskUtil, also it might be buggy?
	if (!fs.existsSync(`${PERSISTENT_DIR}dataset_index.json`)) {
		fs.mkdirSync(PERSISTENT_DIR);
	} else {
		let indexString = fs.readFileSync(`${PERSISTENT_DIR}dataset_index.json`, {encoding: "utf8"});
		let index: Header[] = JSON.parse(indexString);
		index.push(header);
		toDisk = JSON.stringify(index);
	}

	fs.outputFileSync(`${PERSISTENT_DIR}dataset_index.json`, toDisk);
}

export function removeFromDatasetIndex(id: string) {
	if (!fs.existsSync(`${PERSISTENT_DIR}dataset_index.json`)) {
		throw new NotFoundError("ID not found");
	}
	let indexString = fs.readFileSync(`${PERSISTENT_DIR}dataset_index.json`, {encoding: "utf8"});
	let index: Header[] = JSON.parse(indexString);
	for (let i = 0; i < index.length; i++) {
		if (index[i].id === id) {
			index.splice(i, 1);
			fs.outputFileSync(`${PERSISTENT_DIR}dataset_index.json`, JSON.stringify(index));
			return id;
		}
	}
	throw new NotFoundError("ID not found");
}

export function removeDataset(id: string) {
	let path = `${PERSISTENT_DIR}${id}.json`;
	if (!fs.existsSync(path)) {
		throw new NotFoundError("ID not found");
	} else {
		fs.removeSync(`${PERSISTENT_DIR}${id}.json`);
		removeFromDatasetIndex(id);
	}
}
