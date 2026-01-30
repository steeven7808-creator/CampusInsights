import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";

import {clearDisk, getContentFromArchives} from "../resources/archives/TestUtil";
import InsightFacade from "../../src/controller/InsightFacade";
import {
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import {folderTest} from "@ubccpsc310/folder-test";

chai.use(chaiAsPromised);

const ROOMS_PATH = "/rooms_datasets/";

let pairSections = getContentFromArchives("pair.zip");
let singleSection = getContentFromArchives("single_valid_course.zip");

let campusRooms = getContentFromArchives(ROOMS_PATH + "campus.zip");
let smallRooms = getContentFromArchives(ROOMS_PATH + "campus_small.zip");

type Input = unknown;
type Output = InsightResult[];
type Error = "InsightError" | "ResultTooLargeError";

describe("InsightFacade", function () {
	describe("addDataset success tests", function () {
		let sections: string;
		let facade: InsightFacade;

		before(function () {
			sections = singleSection;
		});

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should fulfill adding a new dataset with a valid ID", function () {
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.deep.equal(["1234"]);
		});
		it("should accept multiple datasets with unique IDs", function () {
			const first = facade.addDataset("1", sections, InsightDatasetKind.Sections);
			return expect(first)
				.to.eventually.have.deep.members(["1"])
				.then(function () {
					const second = facade.addDataset("2", sections, InsightDatasetKind.Sections);
					return expect(second)
						.to.eventually.have.deep.members(["1", "2"])
						.then(function () {
							const third = facade.addDataset("3", sections, InsightDatasetKind.Sections);
							return expect(third).to.eventually.have.deep.members(["1", "2", "3"]);
						});
				});
		});

		// note dataset can still include non valid files
		it("Should add a dataset but skip non JSON file", async function () {
			let includesPDF: string = getContentFromArchives("some_invalid_file_format.zip");
			return facade.addDataset("includesPDF", includesPDF, InsightDatasetKind.Sections).then((result) => {
				expect(result).to.deep.equal(["includesPDF"]);
			});
		});

		// A dataset contains some invalid sections: section doesn't contain every field that can be used for a query
		it("Should add a dataset but skip invalid sections", async function () {
			let invalidSections = getContentFromArchives("courses_invalidSections.zip");
			return facade.addDataset("invalidSections", invalidSections, InsightDatasetKind.Sections).then((result) => {
				expect(result).to.deep.equal(["invalidSections"]);
			});
		});

		// A dataset contains only one section: fields all present but some empty
		it("Should add dataset with section having empty fields", async function () {
			let emptyFieldsSection = getContentFromArchives("section_with_emptyFields.zip");
			return facade
				.addDataset("emptyFieldsSection", emptyFieldsSection, InsightDatasetKind.Sections)
				.then((result) => {
					expect(result).to.deep.equal(["emptyFieldsSection"]);
				});
		});

		it("Should be able to handle adding a large dataset", async function () {
			sections = pairSections;
			return facade.addDataset("sections", sections, InsightDatasetKind.Sections).then((result) => {
				expect(result).to.deep.equal(["sections"]);
			});
		});
	});

	describe("addDataset rooms success tests", () => {
		let facade: InsightFacade;

		beforeEach(() => {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should accept dataset with invalid links if it has at least one valid room", () => {
			let rooms = getContentFromArchives(ROOMS_PATH + "some_valid_links.zip");
			const result = facade.addDataset("someValidLinks", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.deep.members(["someValidLinks"]);
		});

		it("should accept big rooms dataset", () => {
			let rooms = getContentFromArchives(ROOMS_PATH + "campus.zip");
			const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.deep.members(["rooms"]);
		});

		// comment this out before making a PR
		// it("should accept MAUD and NIT and ORCH", () => {
		// 	let rooms = getContentFromArchives(ROOMS_PATH + "campusMAUDandNIT.zip");
		// 	const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
		// 	return expect(result).to.eventually.have.deep.members(["rooms"]);
		// });

		// comment this out before making a PR
		// it("should accept, has only one building (WOOD) - used for debugging purposes", function() {
		// 	let rooms = getContentFromArchives(ROOMS_PATH + "campusValidOnlyOneBuilding.zip");
		// 	const result = facade.addDataset("1234", rooms, InsightDatasetKind.Rooms);
		// 	return expect(result).to.eventually.deep.equal(["1234"]);
		// });
	});

	describe("addDataset invalid ID tests", function () {
		let sections: string;
		let facade: InsightFacade;

		before(function () {
			sections = singleSection;
		});

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should reject adding a dataset with an empty id", function () {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding a dataset with an id containing an underscore", function () {
			const result = facade.addDataset("0_0", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding a dataset with an existing id", function () {
			const first = facade.addDataset("24", sections, InsightDatasetKind.Sections);
			return expect(first)
				.to.eventually.deep.equal(["24"])
				.then(function () {
					const result = facade.addDataset("24", sections, InsightDatasetKind.Sections);
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});
		});
	});

	describe("addDataset invalid content tests", function () {
		let sections: string;
		let facade: InsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should reject empty content", function () {
			sections = "";
			const result = facade.addDataset("empty", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject content that is not a zip file", function () {
			sections = "hehexd";
			const result = facade.addDataset("hehexd", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains no sections", function () {
			sections = getContentFromArchives("no_fields.zip");
			const result = facade.addDataset("a1b2c3", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that does not contain a result key", function () {
			sections = getContentFromArchives("missing_result.zip");
			const result = facade.addDataset("a1b2c3", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that does not contain a courses dir", function () {
			sections = getContentFromArchives("no_courses_dir.zip");
			const result = facade.addDataset("a1b2c3", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Course field)", function () {
			sections = getContentFromArchives("missing_Course.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing id field)", function () {
			sections = getContentFromArchives("missing_id.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Title field)", function () {
			sections = getContentFromArchives("missing_Title.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Professor field)", function () {
			sections = getContentFromArchives("missing_Professor.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Subject field)", function () {
			sections = getContentFromArchives("missing_Subject.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Year field)", function () {
			sections = getContentFromArchives("missing_Year.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Avg field)", function () {
			sections = getContentFromArchives("missing_Avg.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Pass field)", function () {
			sections = getContentFromArchives("missing_Pass.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Fail field)", function () {
			sections = getContentFromArchives("missing_Fail.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Audit field)", function () {
			sections = getContentFromArchives("missing_Audit.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// Attempting to add a dataset with a file not in JSON format
		it("Should reject with an input dataset having only non JSON file", function () {
			let notJSONCourse = getContentFromArchives("only_nonjson_course.zip");
			return expect(
				facade.addDataset("notJSONCourse", notJSONCourse, InsightDatasetKind.Sections)
			).to.eventually.be.rejectedWith(InsightError);
		});

		// Attempting to add a dataset that contains no courses
		it("Should reject with an input dataset missing courses", async function () {
			let noCourses = getContentFromArchives("no_courses.zip");
			return expect(
				facade.addDataset("noCourses", noCourses, InsightDatasetKind.Sections)
			).to.eventually.be.rejectedWith(InsightError);
		});
	});

	describe("addDataset incorrect kind tests", function () {
		let sections: string;
		let rooms: string;
		let facade: InsightFacade;

		before(function () {
			sections = singleSection;
			rooms = smallRooms;
		});

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should reject sections dataset that is of kind 'rooms'", function () {
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject rooms dataset that is of kind 'sections'", () => {
			const result = facade.addDataset("1234", rooms, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});

	describe("addDataset rooms invalid index tests", () => {
		let facade: InsightFacade;

		beforeEach(() => {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should reject a dataset without a buildings table", () => {
			let rooms = getContentFromArchives(ROOMS_PATH + "no_building_table.zip");
			return expect(facade.addDataset("1234", rooms, InsightDatasetKind.Rooms)).to.eventually.be.rejectedWith(
				InsightError
			);
		});

		it("should reject a dataset with an empty buildings table", () => {
			let rooms = getContentFromArchives(ROOMS_PATH + "empty_building_table.zip");
			return expect(facade.addDataset("1234", rooms, InsightDatasetKind.Rooms)).to.eventually.be.rejectedWith(
				InsightError
			);
		});

		it("should reject a dataset with a buildings table with no table body", () => {
			let rooms = getContentFromArchives(ROOMS_PATH + "empty_body_building_table.zip");
			return expect(facade.addDataset("1234", rooms, InsightDatasetKind.Rooms)).to.eventually.be.rejectedWith(
				InsightError
			);
		});

		// apparently this is okay, see @684 on piazza
		// it("should reject a dataset with a buildings table containing invalid classes", () => {
		// 	let rooms = getContentFromArchives(ROOMS_PATH + "invalid_table_classes.zip");
		// 	return expect(facade.addDataset("1234", rooms, InsightDatasetKind.Rooms)).to.eventually.be.rejectedWith(
		// 		InsightError
		// 	);
		// });

		it("should reject a dataset with no valid rooms", () => {
			let rooms = getContentFromArchives(ROOMS_PATH + "no_valid_rooms.zip");
			return expect(facade.addDataset("1234", rooms, InsightDatasetKind.Rooms)).to.eventually.be.rejectedWith(
				InsightError
			);
		});

		it("should reject a dataset with no valid links to building files (no valid rooms)", () => {
			let rooms = getContentFromArchives(ROOMS_PATH + "no_valid_links.zip");
			return expect(facade.addDataset("1234", rooms, InsightDatasetKind.Rooms)).to.eventually.be.rejectedWith(
				InsightError
			);
		});

		it("should reject with no building files in dataset", function () {
			let rooms = getContentFromArchives(ROOMS_PATH + "campusNoBuildingFiles.zip");
			const result = facade.addDataset("1234", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with no building table rows in index", function () {
			let rooms = getContentFromArchives(ROOMS_PATH + "campusNoBuildingListedInTable.zip");
			const result = facade.addDataset("1234", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when building's html content is invalid", function () {
			let rooms = getContentFromArchives(ROOMS_PATH + "campusInvalidBuildingContent.zip");
			const result = facade.addDataset("1234", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});

	describe("removeDataset", function () {
		let sections: string;
		let facade: InsightFacade;

		before(function () {
			sections = singleSection;
		});

		beforeEach(async function () {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("1234", sections, InsightDatasetKind.Sections);
		});

		it("should reject removing a dataset with an empty id", function () {
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject removing a dataset with id containing an underscore", function () {
			const result = facade.removeDataset("0_0");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject removing a dataset that doesn't exist in the dataset", function () {
			const result = facade.removeDataset("9999");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should successfully remove dataset with id 1234", function () {
			const result = facade.removeDataset("1234");
			return expect(result)
				.to.eventually.be.deep.equal("1234")
				.then(function () {
					return expect(facade.listDatasets()).to.eventually.be.deep.equal([]);
				});
		});

		// Multiple removals of datasets
		it("Should remove multiple datasets from list", function () {
			return facade.addDataset("1", sections, InsightDatasetKind.Sections).then(() => {
				facade.addDataset("2", sections, InsightDatasetKind.Sections).then(async (result) => {
					expect(result).to.deep.equal(["1", "2"]);
					const result1 = await facade.removeDataset("1");
					expect(result1).to.deep.equal("1");
					const result2 = await facade.removeDataset("2");
					expect(result2).to.deep.equal("2");
					expect(facade.listDatasets()).to.deep.equal([]);
				});
			});
		});
	});

	describe("listDatasets", function () {
		let sections: string;
		let facade: InsightFacade;

		before(function () {
			sections = singleSection;
		});
		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should return an empty list when there are no datasets to list", function () {
			return expect(facade.listDatasets()).to.eventually.be.deep.equal([]);
		});

		it("should have one elem in the array that is the single dataset added in before", async function () {
			await facade.addDataset("test", sections, InsightDatasetKind.Sections);
			const expected: InsightDataset[] = [
				{
					id: "test",
					kind: InsightDatasetKind.Sections,
					numRows: 1,
				},
			];
			const result = facade.listDatasets();
			return expect(result).to.eventually.have.deep.members(expected);
		});

		it("should show all datasets that have been added", async function () {
			await facade.addDataset("1", sections, InsightDatasetKind.Sections);
			let expected: InsightDataset[] = [
				{
					id: "1",
					kind: InsightDatasetKind.Sections,
					numRows: 1,
				},
			];
			let result = await facade.listDatasets();
			expect(result).to.have.deep.members(expected);

			await facade.addDataset("2", sections, InsightDatasetKind.Sections);
			expected.push({
				id: "2",
				kind: InsightDatasetKind.Sections,
				numRows: 1,
			});
			result = await facade.listDatasets();
			// expect(result).to.eventually.have.deep.members(expected);
			expect(result).to.have.deep.members(expected);
		});

		it("should not show datasets that have been removed", async function () {
			await facade.addDataset("1", sections, InsightDatasetKind.Sections);
			await facade.addDataset("2", sections, InsightDatasetKind.Sections);
			let expected: InsightDataset[] = [
				{
					id: "1",
					kind: InsightDatasetKind.Sections,
					numRows: 1,
				},
				{
					id: "2",
					kind: InsightDatasetKind.Sections,
					numRows: 1,
				},
			];
			let result = await facade.listDatasets();
			expect(result).to.have.deep.members(expected);

			await facade.removeDataset("2");
			expected.pop();
			return expect(facade.listDatasets()).to.eventually.be.deep.equal(expected);
		});

		it("should succeed when Rooms are added then Sections are added, and list Room and Section", function () {
			let rooms = getContentFromArchives(ROOMS_PATH + "campus.zip");
			return facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms).then(() => {
				return facade.addDataset("sections", sections, InsightDatasetKind.Sections).then(() => {
					return expect(facade.listDatasets()).to.eventually.be.deep.equal([
						{
							id: "rooms",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						},
						{
							id: "sections",
							kind: InsightDatasetKind.Sections,
							numRows: 1,
						},
					]);
				});
			});
		});
	});

	// TODO: uncomment after checking with bot; commented out to prevent timeout issues
	describe("performQuery", function () {
		describe("Orderless", () => {
			let facade: InsightFacade;

			before(function () {
				console.info(`Before: ${this.test?.parent?.title}`);
				clearDisk();
				facade = new InsightFacade();

				// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
				// Will *fail* if there is a problem reading ANY dataset.
				const loadDatasetPromises = [
					facade.addDataset("sections", pairSections, InsightDatasetKind.Sections),
					facade.addDataset("single", singleSection, InsightDatasetKind.Sections),
					facade.addDataset("rooms", campusRooms, InsightDatasetKind.Rooms),
				];

				return Promise.all(loadDatasetPromises);
			});

			after(function () {
				console.info(`After: ${this.test?.parent?.title}`);
				clearDisk();
			});

			function target(input: Input): Promise<Output> {
				return facade.performQuery(input);
			}

			function errorValidator(error: any): error is Error {
				return error === "InsightError" || error === "ResultTooLargeError";
			}

			function assertOnResult(actual: any, expected: Output): void {
				expect(actual).to.have.deep.members(expected);
			}

			function assertOnError(actual: any, expected: Error): void {
				if (expected === "InsightError") {
					expect(actual).to.be.an.instanceOf(InsightError);
				} else {
					expect(actual).to.be.an.instanceOf(ResultTooLargeError);
				}
			}

			folderTest<Input, Output, Error>("performQuery tests", target, "./test/resources/json", {
				errorValidator,
				assertOnError,
				assertOnResult,
			});
		});

		describe("Ordered", () => {
			let facade: InsightFacade;

			before(function () {
				console.info(`Before: ${this.test?.parent?.title}`);
				clearDisk();
				facade = new InsightFacade();

				// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
				// Will *fail* if there is a problem reading ANY dataset.
				const loadDatasetPromises = [
					facade.addDataset("sections", pairSections, InsightDatasetKind.Sections),
					facade.addDataset("single", singleSection, InsightDatasetKind.Sections),
					facade.addDataset("rooms", campusRooms, InsightDatasetKind.Rooms),
				];

				return Promise.all(loadDatasetPromises);
			});

			after(function () {
				console.info(`After: ${this.test?.parent?.title}`);
				clearDisk();
			});

			function target(input: Input): Promise<Output> {
				return facade.performQuery(input);
			}

			function errorValidator(error: any): error is Error {
				return error === "InsightError" || error === "ResultTooLargeError";
			}

			function assertOnResult(actual: any, expected: Output): void {
				let isEqual = true;
				for (let i = 0; i < actual.length; i++) {
					const actualInsightResult = actual[i];
					const expectedInsightResult = expected[i];

					if (!isInsightResultEqual(actualInsightResult, expectedInsightResult)) {
						isEqual = false;
						console.log(`InsightResult at index ${i} are different. Expected:
						${JSON.stringify(expectedInsightResult)}, Actual: ${JSON.stringify(actualInsightResult)}`);
					}
				}
				if(!isEqual) {
					throw new InsightError();
				}
			}

			function isInsightResultEqual(actualResult: any, expectedResult: any): boolean {
				const keys1 = Object.keys(actualResult);
				const keys2 = Object.keys(expectedResult);

				if (keys1.length !== keys2.length) {
					return false;
				}

				for (const key of keys1) {
					if (actualResult[key] !== expectedResult[key]) {
						return false;
					}
				}

				return true;
			}


			function assertOnError(actual: any, expected: Error): void {
				if (expected === "InsightError") {
					expect(actual).to.be.an.instanceOf(InsightError);
				} else {
					expect(actual).to.be.an.instanceOf(ResultTooLargeError);
				}
			}

			folderTest<Input, Output, Error>("performQuery tests", target, "./test/resources/json/order", {
				errorValidator,
				assertOnError,
				assertOnResult,
			});
		});
	});
});
