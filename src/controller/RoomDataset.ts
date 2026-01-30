import {InsightDatasetClass} from "./InsightDatasetClass";
import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import {defaultTreeAdapter} from "parse5";
import * as parse5 from "parse5";
import {ChildNode, Document, Element} from "parse5/dist/tree-adapters/default";
import {makeAsync} from "./AsyncUtil";
import {Building, BuildingFactory} from "../models/Building";
import * as HTMLUtil from "./HTMLUtil";
import * as DatasetUtil from "./DatasetUtil";
import {InsightData, RoomData} from "../models/IModel";

export class RoomDataset extends InsightDatasetClass {
	// private readonly ROOMS_DIR = "campus/discover/buildings-and-classrooms";
	private readonly INDEX = "index.htm";

	// TODO: change return type to InsightData[]
	protected async processFileContents(content: string): Promise<InsightData[]> {
		let zip: JSZip = new JSZip();
		return zip.loadAsync(content, {base64: true, createFolders: false})
			.catch(() => {
				throw new InsightError("Error loading zip file from content parameter");
			})
			.then(() => {
				return DatasetUtil.getFileFromZip(zip, this.INDEX);
			})
			.catch((err) => {
				throw err;
			})
			.then((index: string) => {
				return HTMLUtil.findTableInHTML(index, "index");
			}).then((buildingTable) => {
				// makeAsync will reject if the result is null, but we double check anyway
				if (buildingTable == null) {
					throw new InsightError("no valid building table");
				}
				return makeAsync(HTMLUtil.getTableRows, "Building table was empty", buildingTable);
			})
			.then((buildingRows) => {
				return makeAsync(this.extractBuildingsFromTable, "Buildings table was empty", buildingRows, zip);
			})
			.then(async (buildings) => {
				let buildingArr: Building[];
				if (buildings == null || (buildingArr = buildings as Building[]).length === 0) {
					throw new InsightError("Buildings table was empty");
				}
				// populate each building -> if error, just return null
				let callback = function(building: Building) {
					return building.addRooms().catch((error) => null);
				};
				await Promise.all((buildingArr).map(callback));
				return buildingArr;
			})
			.then((buildings) => {
				let rooms: RoomData[] = [];
				for (let building of buildings) {
					if (building.rooms) {
						rooms.push(...building.getRoomData());
					}
				}
				// console.log(rooms);
				return rooms;
			})
			.catch((err) => {
				throw err;
			});
	}


	private extractBuildingsFromTable(buildingRows: any, zip: JSZip) {
		if (buildingRows == null || (buildingRows as Element[]).length === 0) {
			throw new InsightError("Building Table was empty");
		}
		let buildings: Building[] = [];
		for (let buildingRow of buildingRows as Element[]) {
			let building = BuildingFactory.createBuilding(buildingRow, zip);
			if (building) {
				buildings.push(building);
			}
		}
		return buildings;
	}

	// ensure header cells contain correct classes
	// TODO: possibly remove, spec doesn't mention any requirements on table header
	private validateHeader(buildingTable: Element) {
		let header: Element | null = null;
		for (let child of defaultTreeAdapter.getChildNodes(buildingTable)) {
			if (defaultTreeAdapter.isElementNode(child)
				&& defaultTreeAdapter.getTagName(child) === parse5.html.TAG_NAMES.THEAD) {
				header = child;
				break;
			}
		}
		if (header == null) {
			throw new InsightError("The header is empty");
		}
		for (let child of defaultTreeAdapter.getChildNodes(header)) {
			if (defaultTreeAdapter.isElementNode(child)
				&& defaultTreeAdapter.getTagName(child) === parse5.html.TAG_NAMES.THEAD) {
				header = child;
				break;
			}
		}
	}
}

