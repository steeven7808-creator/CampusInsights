// iterates through all files in the zip and returns an array of sections
import JSZip from "jszip";
import {Section, SectionClass, SectionQuery} from "../models/ISection";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {SectionDatasetModel} from "../models/IModel";
import fs from "fs-extra";
import {outputDataset} from "./CommonDatasetUtil";

export function sectionLogicAndOutput(data: JSZip, id: string, kind: InsightDatasetKind): Promise<string[]> {
	if(Object.keys(data.files)[0] !== "courses/") {
		return Promise.reject(new InsightError("No root directory 'courses' in given dataset"));
	}
	return sectionFileProcessingPromises(data)
		.then((sectionArr) => {
			return outputDataset(id, kind, sectionArr);
		})
		.catch((error) => {
			return Promise.reject(error);
		});
}

export function sectionFileProcessingPromises(data: JSZip): Promise<Section[]> {
	const sectionArr: Section[] = [];
	const fileProcessingPromises = Object.keys(data.files).map((relativePath) => {
		return data
			.file(relativePath)
			?.async("text")
			.then((fileContent) => {
				// check if fileContent is undefined
				if (!fileContent) {
					return;
				}
				// if start doesnt contain {" and the end doesnt contain "} then its not a json file
				if (!fileContent.startsWith("{") || !fileContent.endsWith("}")) {
					return;
				}
				const sectionQuery: SectionQuery = JSON.parse(fileContent);
				let sections: Section[] = JSON.parse(fileContent).result;
				let section: Section;
				for (section of sections) {
					// check if section is "overall"
					if (section.Section === "overall") {
						section.Year = "1900";
					}
					// check if section is valid
					if (isValidSection(section)) {
						// throw new InsightError("Invalid JSON data in file: " + relativePath);
						sectionArr.push(section);
					}
				}
			})
			.catch((error) => {
				return Promise.reject(error);
			});
	});
	return Promise.all(fileProcessingPromises).then(() => {
		// check if sectionArr is empty
		if (sectionArr.length === 0) {
			throw new InsightError("No valid sections in dataset");
		}
		return sectionArr.flat();
	});
}

// checks if JSON data injected the Section object with valid fields (i.e. not undefined)
export function isValidSection(section: Section): boolean {
	if (!section.Course) {
		return false;
		// throw new InsightError("Invalid Course");
	}
	if (!section.id) {
		return false;
		// throw new InsightError("Invalid id");
	}
	if (section.Title === undefined) {
		return false;
		// throw new InsightError("Invalid Title");
	}
	if (section.Professor === undefined) {
		return false;
		// throw new InsightError("Invalid Professor");
	}
	if (section.Subject === undefined) {
		return false;
		// throw new InsightError("Invalid Subject");
	}
	if (!section.Year) {
		return false;
		// throw new InsightError("Invalid Year");
	}
	if (section.Avg === undefined || section.Avg < 0) {
		return false;
		// throw new InsightError("Invalid Avg");
	}
	if (section.Pass === undefined || section.Pass < 0) {
		return false;
		// throw new InsightError("Invalid Pass");
	}
	if (section.Fail === undefined || section.Fail < 0) {
		return false;
		// throw new InsightError("Invalid Fail");
	}
	return !(section.Audit === undefined || section.Audit < 0);
}
