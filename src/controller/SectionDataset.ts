import {InsightDatasetClass} from "./InsightDatasetClass";
import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import {InsightData, SectionData} from "../models/IModel";

export class SectionDataset extends InsightDatasetClass {

	private readonly SECTIONS_DIR = "courses";

	protected async processFileContents(content: string): Promise<InsightData[]> {
		let zip: JSZip = new JSZip();
		return zip.loadAsync(content, {base64: true, createFolders: false})
			.catch(() => {
				throw new InsightError("Error loading zip file from content parameter");
			})
			.then(() => {
				const dataDirectory = zip.folder(this.SECTIONS_DIR);
				if (!dataDirectory) {
					throw new InsightError("The " + this.SECTIONS_DIR + " directory was not found " +
						"in the zip file. Are you sure this is the right kind of dataset?");
				}
				return dataDirectory;
			})
			.catch((err) => {
				throw err;
			})
			.then((dataDirectory) => {
				const promises: any[] = [];
				dataDirectory.forEach((relativePath, file) => {
					// relativePath part of callback signature on JSZip folder
					promises.push(zip.file(file.name)?.async("text"));
				});
				return Promise.all(promises);
			})
			.catch((err) => {
				throw new InsightError("Error reading a file in the zip: " + err);
			})
			.then((courseStrings) => {
				if (courseStrings.length === 0) {
					throw new InsightError("There were no valid sections in the provided ZIP");
				}
				// use forEach instead of map to omit invalid courses
				let allSections: SectionData[] = [];
				courseStrings.forEach((courseString) => {
					let processedCourse = this.processCourseString(courseString);
					if (processedCourse != null) {
						allSections.push(...processedCourse);
					}
				});
				return allSections;
			})
			.catch((err) => {
				// console.log("something unexpected happened: " + err);
				throw err;
			});
	}

	private processCourseString(courseString: string): SectionData[] | null {
		let rawCourseObject;
		try {
			rawCourseObject = JSON.parse(courseString);
		} catch {
			return null;
		}
		if (Object.keys(rawCourseObject)[0] !== "result") {
			// we just skip this one
			// throw new InsightError("Section data should be stored in an array under 'result' key");
			return null;
		}
		let rawSectionsData: object[] = rawCourseObject["result"];
		let processedCourse: SectionData[] = [];
		rawSectionsData.forEach((rawSection) => {
			let processedSection: SectionData | null = this.processRawSection(rawSection);
			if (processedSection != null) {
				processedCourse.push(processedSection);
			}
		});

		return processedCourse;
	}

	private processRawSection(rawSection: object): SectionData | null {
		let result: SectionData;
		if ("Section" in rawSection && rawSection["Section"] === "overall" && "Year" in rawSection) {
			rawSection.Year = 1900;
		}
		// if we don't validate in the same function scope, we get warnings
		if (!("id" in rawSection
			&& "Course" in rawSection
			&& "Title" in rawSection
			&& "Professor" in rawSection
			&& "Subject" in rawSection
			&& "Year" in rawSection
			&& "Avg" in rawSection
			&& "Pass" in rawSection
			&& "Fail" in rawSection
			&& "Audit" in rawSection)) {
			return null;
		}
		result = {
			uuid: (rawSection.id as string).toString(),		// get string from number
			id: rawSection.Course as string,
			title: rawSection.Title as string,
			instructor: rawSection.Professor as string,
			dept: rawSection.Subject as string,
			year: parseInt(rawSection.Year as string, 10) as number,
			avg: rawSection.Avg as number,
			pass: rawSection.Pass as number,
			fail: rawSection.Fail as number,
			audit: rawSection.Audit as number
		};
		return result;
	}
}
