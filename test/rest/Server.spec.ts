import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect} from "chai";
import request, {Response} from "supertest";
import {clearDisk} from "../../test_template/TestUtil";
import {getContentFromArchives} from "../resources/archives/TestUtil";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;
	let singleSection: string;
	let smallRooms: string;
	let pairsSections: string;

	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);
		singleSection = getContentFromArchives("single_valid_course.zip");
		smallRooms = getContentFromArchives("/rooms_datasets/campus_small.zip");
		pairsSections = getContentFromArchives("pair.zip");

		server.start();
	});

	after(function () {
		server.stop();
	});

	beforeEach(function () {
		console.info("Server::Starting test: " + this.currentTest?.title);
		clearDisk();

	});

	afterEach(function () {
		console.info("Server::Finished test: " + this.currentTest?.title);
		clearDisk();
	});

	it("Should PUT simple sections dataset", function () {
		try {
			return request("http://localhost:4321")
				.put("/dataset/smallSection/sections")
				.send(Buffer.from(singleSection, "base64"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.body.result).to.deep.equal(["smallSection"]);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should PUT simple rooms dataset", function () {
		try {
			return request("http://localhost:4321")
				.put("/dataset/smallRooms/rooms")
				.send(Buffer.from(smallRooms, "base64"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.body.result).to.deep.equal(["smallRooms"]);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should PUT multiple datasets", function () {
		try {
			return request("http://localhost:4321")
				.put("/dataset/datasetOne/sections")
				.send(Buffer.from(singleSection, "base64"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.body.result).to.deep.equal(["datasetOne"]);
					expect(res.status).to.be.equal(200);
				}).then(function () {
					return request("http://localhost:4321")
						.put("/dataset/datasetTwo/rooms")
						.send(Buffer.from(smallRooms, "base64"))
						.set("Content-Type", "application/x-zip-compressed")
						.then(function (res: Response) {
							// some logging here please!
							expect(res.body.result).to.deep.equal(["datasetOne","datasetTwo"]);
							expect(res.status).to.be.equal(200);
						});
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should fail to PUT section with incorrect kind", function () {
		try {
			return request("http://localhost:4321")
				.put("/dataset/smallSection/sections")
				.send(Buffer.from(smallRooms, "base64"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.body.error).to.deep.equal("No root directory 'courses' in given dataset");
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should fail to PUT room with incorrect kind", function () {
		try {
			return request("http://localhost:4321")
				.put("/dataset/smallSection/rooms")
				.send(Buffer.from(singleSection, "base64"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.body.error).to.deep.equal("No valid room in dataset");
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should fail to PUT dataset with illegal kind", function () {
		try {
			return request("http://localhost:4321")
				.put("/dataset/smallSection/asdfj")
				.send(Buffer.from(singleSection, "base64"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.body.error).to.deep.equal("Illegal dataset kind: must be sections or rooms");
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should fail to PUT dataset with id already existing", async function () {
		try {
			await facade.addDataset("duplicate", singleSection, InsightDatasetKind.Sections);
			return request("http://localhost:4321")
				.put("/dataset/duplicate/sections")
				.send(Buffer.from(singleSection, "base64"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					expect(res.body.error).to.deep.equal("ID already exists");
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should DELETE test for dataset with id", async function () {
		try {
			await facade.addDataset("sample", singleSection, InsightDatasetKind.Sections);
			return request("http://localhost:4321")
				.delete("/dataset/sample")
				.then(function (res: Response) {
					expect(res.body.result).to.deep.equal("sample");
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should fail DELETE test for nonexistent dataset with id", async function () {
		try {
			await facade.addDataset("sample", singleSection, InsightDatasetKind.Sections);
			return request("http://localhost:4321")
				.delete("/dataset/lmao")
				.then(function (res: Response) {
					expect(res.body.error).to.deep.equal("ID not found");
					expect(res.status).to.be.equal(404);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should fail DELETE test for illegal id", async function () {
		try {
			await facade.addDataset("sample", singleSection, InsightDatasetKind.Sections);
			await facade.addDataset("rooms", smallRooms, InsightDatasetKind.Rooms);
			return request("http://localhost:4321")
				.delete("/dataset/sample_sample")
				.then(function (res: Response) {
					expect(res.body.error).to.deep.equal("Invalid ID");
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should POST correctly formatted query", async function () {
		try {
			await facade.addDataset("sections", pairsSections, InsightDatasetKind.Sections);
			return request("http://localhost:4321")
				.post("/query")
				.send({
					WHERE: {
						AND: [
							{
								IS: {
									sections_dept: "*cpsc*"
								}
							},
							{
								GT: {
									sections_avg: 90
								}
							}
						]
					},
					OPTIONS: {
						COLUMNS: [
							"sections_title",
							"maxFail"
						],
						ORDER: {
							dir: "DOWN",
							keys: [
								"maxFail"
							]
						}
					},
					TRANSFORMATIONS: {
						GROUP: [
							"sections_title"
						],
						APPLY: [
							{
								maxFail: {
									MAX: "sections_fail"
								}
							}
						]
					}
				})
				.set("Content-Type", "application/json")
				.then(function (res: Response) {
					expect(res.body.result).to.deep.equal([
						{
							sections_title: "alg in bioin",
							maxFail: 0
						},
						{
							sections_title: "honours thesis",
							maxFail: 0
						},
						{
							sections_title: "student seminar",
							maxFail: 0
						},
						{
							sections_title: "thry of automata",
							maxFail: 0
						},
						{
							sections_title: "computl ling 1",
							maxFail: 0
						},
						{
							sections_title: "software eng",
							maxFail: 0
						},
						{
							sections_title: "artif intell 2",
							maxFail: 0
						},
						{
							sections_title: "comp comm protcl",
							maxFail: 0
						},
						{
							sections_title: "machine learn i",
							maxFail: 0
						},
						{
							sections_title: "m.sc major essay",
							maxFail: 0
						}
					]);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should fail to POST incorrectly formatted query", async function () {
		try {
			return request("http://localhost:4321")
				.post("/query")
				.send({
					OPTIONS: {
						COLUMNS: [
							"sections_uuid",
							"sections_id",
							"sections_avg",
						],
						ORDER: "sections_avg"
					}
				})
				.set("Content-Type", "application/json")
				.then(function (res: Response) {
					expect(res.body.error).to.deep.equal("Missing WHERE");
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should fail to POST query multiple datasets referenced", async function () {
		try {
			return request("http://localhost:4321")
				.post("/query")
				.send({
					WHERE: {},
					OPTIONS: {
						COLUMNS: [
							"sections_uuid",
							"rooms_dept",
							"rooms_year"
						],
						ORDER: "sections_uuid"
					}
				})
				.set("Content-Type", "application/json")
				.then(function (res: Response) {
					expect(res.body.error).to.deep.equal("Cannot query more than one dataset");
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should fail to POST query with result too large", async function () {
		try {
			await facade.addDataset("sections", pairsSections, InsightDatasetKind.Sections);
			return request("http://localhost:4321")
				.post("/query")
				.send({
					WHERE: {},
					OPTIONS: {
						COLUMNS: [
							"sections_uuid"
						],
					}
				})
				.set("Content-Type", "application/json")
				.then(function (res: Response) {
					expect(res.body.error).to.deep.equal("The result is too big. " +
						"Only queries with a maximum of 5000 results are supported.");
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should GET no datasets, none added", async function () {
		try {
			clearDisk();
			return request("http://localhost:4321")
				.get("/datasets")
				.then(function (res: Response) {
					expect(res.body.result).to.deep.equal([]);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("Should GET datasets, some added", async function () {
		try {
			await facade.addDataset("sections", singleSection, InsightDatasetKind.Sections);
			await facade.addDataset("rooms", smallRooms, InsightDatasetKind.Rooms);
			return request("http://localhost:4321")
				.get("/datasets")
				.then(function (res: Response) {
					expect(res.body.result).to.deep.equal([
						{id: "rooms", kind: "rooms", numRows: 10},
						{id: "sections", kind: "sections", numRows: 1}
					]);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

});
