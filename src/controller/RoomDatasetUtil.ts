import JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {DomNode, RoomClass} from "../models/IRoom";
import {parse} from "parse5";
import {GeoResponse} from "../models/IGeoResponse";
import {outputDataset} from "./CommonDatasetUtil";
import {request} from "http";

export function roomLogicAndOutput(data: JSZip, id: string, kind: InsightDatasetKind): Promise<string[]> {
	return roomProcessingPromises(data)
		.then((roomArr) => {
			// return outputRoomDataset(id, kind, roomArr);
			return outputDataset(id, kind, roomArr);
		})
		.catch((error) => {
			return Promise.reject(error);
		});
}
// make rooms filled with fullname, shortname, and address
function masterRecurseAST(currNode: DomNode[], size: number, roomArr: RoomClass[], room: RoomClass) {
	// base case
	if (size === 0) {
		return;
	}
	for (let i = 0; i < size; i++) {
		// check if node is nested in valid table class
		const classAttribute = getAttributeValue(currNode[i].parentNode?.attrs ?? []);
		if (classAttribute !== null) {
			room = masterIterativelyPopulateRoom(classAttribute, room, currNode[i]);
			// address is the last content added for each room for master index
			if (room.address !== undefined) {
				// if room does not already exist in roomArr, then add it
				if (!roomArr.includes(room)) {
					roomArr.push(room);
				}
				room = {} as RoomClass;
			}
		}
		// if node has child nodes then recurse
		if (currNode[i].childNodes !== undefined) {
			masterRecurseAST(currNode[i].childNodes ?? [], currNode[i].childNodes?.length ?? 0, roomArr, room);
		}
	}
}
function recurseAST(currNode: DomNode[], size: number, roomArr: RoomClass[], buildingCode: string, room: RoomClass) {
	// base case
	if (size === 0) {
		return;
	}

	for (let i = 0; i < size; i++) {
		// check if node is nested in valid table class
		const classAttribute = getAttributeValue(currNode[i].parentNode?.attrs ?? []);
		if (classAttribute !== null) {
			room.shortname = buildingCode;
			room = iterativelyPopulateRoom(classAttribute, room, currNode[i]);
			if (room.type !== undefined) {
				// if room does not already exist in roomArr, then add it
				if (!roomArr.includes(room)) {
					roomArr.push(room);
				}
				room = {} as RoomClass;
			}
		}
		// if node has child nodes then recurse
		if (currNode[i].childNodes !== undefined) {
			recurseAST(currNode[i].childNodes ?? [], currNode[i].childNodes?.length ?? 0, roomArr, buildingCode, room);
		}
	}
}
function masterIterativelyPopulateRoom(attribute: string, room: RoomClass, currNode: DomNode): RoomClass {
	switch (attribute) {
		case "views-field views-field-title": // fullname
			if (currNode.childNodes?.[0].value !== undefined) {
				// Matches anything between the last '/' and '.htm'
				const hrefVal = currNode.attrs?.[0].value;
				const regex: RegExp = /([^/]+)\.htm$/;
				const match: RegExpExecArray | null = regex.exec(hrefVal);
				const namePart: string = match ? match[1] : "";
				if (namePart !== room.shortname) {
					break;
				}
				const fullName = currNode.childNodes?.[0].value;
				room.fullname = fullName;
			}
			break;
		case "views-field views-field-field-building-code": // shortname
			if (currNode.value?.trim() !== "") {
				const shortName = currNode.value?.trim();
				if (shortName === "Code") {
					break;
				}
				room.shortname = shortName || "";
			}
			break;
		case "views-field views-field-field-building-address": // address
			if (currNode.value?.trim() !== "") {
				const address = currNode.value?.trim();
				if (address === "Address" || address === undefined) {
					break;
				}
				room.address = address;
			}
			break;
	}
	return room;
}
function iterativelyPopulateRoom(attribute: string, room: RoomClass, currNode: DomNode): RoomClass {
	switch (attribute) {
		case "views-field views-field-field-room-number": // number
			if (currNode.childNodes?.[0].value !== undefined) {
				room.number = currNode.childNodes?.[0].value ?? "";
				room.href = getAttributeValue(currNode.attrs ?? [], "href") ?? "";
			}
			break;
		case "views-field views-field-field-room-capacity": // seats
			if (currNode.value?.trim() !== "") {
				const number = currNode.value?.trim();
				if (number === "Capacity") {
					break;
				}
				room.seats = Number(number);
			}
			break;
		case "views-field views-field-field-room-type": // type
			if (currNode.value?.trim() !== "") {
				const type = currNode.value?.trim();
				if (type === "Room type") {
					break;
				}
				room.type = type || "";
			}
			break;
		case "views-field views-field-field-room-furniture": // furniture
			if (currNode.value?.trim() !== "") {
				const furniture = currNode.value?.trim();
				if (furniture === "Furniture type") {
					break;
				}
				room.furniture = furniture || "";
			}
			break;
	}
	return room;
}
async function combineMasterAndRoomLogic(roomArr: RoomClass[], masterRoomArr: RoomClass[]): Promise<RoomClass[]> {
	if (masterRoomArr.length === 0 || roomArr.length === 0) {
		throw new InsightError("No valid room in dataset");
	}
	const geoPromises = masterRoomArr.map(async (room) => {
		try {
			const geoData = await fetchData(room.address);
			if (geoData.lat === undefined || geoData.lon === undefined) {
				throw new InsightError("Failed to fetch lat/lon for address: " + room.address);
			}
			room.lat = geoData.lat;
			room.lon = geoData.lon;
			return room;
		} catch (error) {
			// console.error(`Failed to fetch lat/lon for address: ${room.address}`, error);
			return null;
		}
	});

	const updatedRooms: Array<RoomClass | null> = await Promise.all(geoPromises);

	const combinedRoomArr = roomArr
		.map((room) => {
			const masterRoom = updatedRooms.find((masterRoomFind) => masterRoomFind?.shortname === room.shortname);
			return {...room, ...masterRoom, name: masterRoom?.shortname + " " + room.number};
		})
		.filter((room) => isRoomValid(room));
	return combinedRoomArr;
}
function isRoomValid(room: RoomClass): boolean {
	if (
		room.fullname === undefined ||
		room.shortname === undefined ||
		room.number === undefined ||
		room.name === undefined ||
		room.address === undefined ||
		room.lat === undefined ||
		room.lon === undefined ||
		room.seats === undefined ||
		room.type === undefined ||
		room.furniture === undefined ||
		room.href === undefined
	) {
		return false;
	}
	return true;
}
function processZipContent(data: JSZip, masterRoomArr: RoomClass[], roomArr: RoomClass[]) {
	const fileProcessingPromises = Object.keys(data.files).map((relativePath) => {
		return data
			.file(relativePath)
			?.async("text")
			.then((fileContent) => {
				// check file ends with .htm before parsing
				if (!relativePath.endsWith(".htm")) {
					return;
				}
				const parse5AST = parse(fileContent);
				// typecast parse5 to Domnode for easier type checking
				const DomNodes = parse5AST.childNodes as DomNode[];
				// check if file is in building or is master index
				let buildingCode = "";
				if (relativePath.includes("/buildings-and-classrooms/")) {
					buildingCode = relativePath
						.split("/buildings-and-classrooms/")[1]
						.split("/")[0]
						.replace(".htm", "");
				} else {
					// dig through child nodes recursively
					// master index of buildings
					masterRecurseAST(DomNodes, parse5AST.childNodes.length, masterRoomArr, {} as RoomClass);
					return masterRoomArr;
				}
				// recurse through all nodes, start populating array if buildingCode is not empty
				recurseAST(DomNodes, parse5AST.childNodes.length, roomArr, buildingCode, {} as RoomClass);
				return roomArr;
			})
			.catch((error) => {
				return Promise.reject(error);
			});
	});
	return fileProcessingPromises;
}
export function roomProcessingPromises(data: JSZip): Promise<RoomClass[]> {
	const roomArr: RoomClass[] = [];
	const masterRoomArr: RoomClass[] = [];
	const fileProcessingPromises = processZipContent(data, masterRoomArr, roomArr);
	return Promise.all(fileProcessingPromises).then(() => {
		return combineMasterAndRoomLogic(roomArr, masterRoomArr);
	});
}
function getAttributeValue(attrs: Array<{name?: string; value?: string}>, attrKey = "class"): string | null {
	for (let attr of attrs) {
		if (attr.name === attrKey) {
			return attr.value || null;
		}
	}
	return null;
}
async function fetchData(rawAddress: string | undefined): Promise<GeoResponse> {
	if (rawAddress === undefined || rawAddress === "") {
		throw new InsightError("Empty address");
	}
	const baseURL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team279/";
	const encodedAddress = encodeURIComponent(rawAddress);
	const fullURL = new URL(baseURL + encodedAddress);
	return new Promise((resolve, reject) => {
		const requestOptions = {
			hostname: fullURL.hostname,
			port: fullURL.port,
			path: fullURL.pathname,
			method: "GET",
		};
		const req = request(requestOptions, (res) => {
			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});
			res.on("end", () => {
				if (res.statusCode !== 200) {
					reject(new InsightError("Network response was not ok"));
				} else {
					try {
						const jsonData = JSON.parse(data);
						resolve(jsonData);
					} catch (error) {
						reject(new InsightError("Failed to parse JSON response"));
					}
				}
			});
		});
		req.on("error", (error) => {
			reject(error);
		});
		req.end();
	});
}
