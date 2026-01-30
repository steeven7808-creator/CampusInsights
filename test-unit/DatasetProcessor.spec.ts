import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";

import {getContentFromArchives} from "../test/resources/archives/TestUtil";

import {InsightDatasetKind} from "../src/controller/IInsightFacade";
import {createInsightDataset} from "../src/controller/DatasetUtil";

const ROOMS_PATH = "rooms_datasets/";

let pairSections = getContentFromArchives("pair.zip");
let singleSection = getContentFromArchives("single_valid_course.zip");
let smallSections = getContentFromArchives("five_big_courses.zip");

let campusRooms = getContentFromArchives(ROOMS_PATH + "campus.zip");
let smallRooms = getContentFromArchives(ROOMS_PATH + "campus_small.zip");

chai.use(chaiAsPromised);

describe("InsightDatasetClass", () => {
	describe("Constructor", () => {
		// it("process file contents for sections dataset", async () => {
		// 	let dataset = createInsightDataset(
		// 		"test",
		// 		InsightDatasetKind.Sections,
		// 		0);
		// 	await dataset.addData(smallSections);
		// 	await dataset.writeToDisk();
		// 	// return expect(DiskUtil.retrieveAllDatasetIds()).to.eventually.deep.equal(["asdf"]);
		// });
		it("process file contents for rooms dataset", () => {
			let dataset = createInsightDataset(
				"test",
				InsightDatasetKind.Rooms,
				0);
			let result = dataset.addData(smallRooms);
			return expect(result).to.eventually.deep.equal(["asdf"]);
		});
	});
});
