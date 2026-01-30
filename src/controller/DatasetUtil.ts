import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {SectionDataset} from "./SectionDataset";
import {RoomDataset} from "./RoomDataset";
import * as DiskUtil from "./DiskUtil";
import JSZip from "jszip";

export function createInsightDataset(id: string, kind: InsightDatasetKind, numRows: number) {
	if (kind === InsightDatasetKind.Sections) {
		return new SectionDataset(id, kind, numRows);
	} else if (kind === InsightDatasetKind.Rooms) {
		return new RoomDataset(id, kind, numRows);
	} else {
		throw new InsightError("invalid kind");
	}
}

export async function getFileFromZip(zip: JSZip, path: string) {
	const index = zip.file(path);
	if (!index) {
		throw new InsightError("'" + path + "' was not found in the zip file.");
	}
	return index.async("text");
}


export function validateID(id: string, removing: boolean = false) {
	if (id == null || !id.trim() || id.includes("_")) {
		throw new InsightError("Invalid ID: '" + id + "'");
	}
	// check if id already exists in dataset
	if (DiskUtil.doesDatasetIDExist(id)) {
		if (removing) {
			return;
		} else {
			throw new InsightError("Dataset ID: '" + id + "', already exists");
		}
	}
}

// export function isValidID(id: string) {
// 	return !(id == null || !id.trim() || id.includes("_") || DiskUtil.doesDatasetIDExist(id));
// }
