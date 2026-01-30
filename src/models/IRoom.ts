import {RoomData} from "./IModel";

export class RoomClass implements RoomData {
	public fullname: string; // Full building name.
	public shortname: string; // Short building name.
	public number: string; // The room number. Not always a number so represented as a string.
	public name: string; // The room id. Should be rooms_shortname + "_" + rooms_number.
	public address: string; // The building address.
	public lat: number; // The latitude of the building.
	public lon: number; // The longitude of the building.
	public seats: number; // The number of seats in the room.
	public type: string; // The room type.
	public furniture: string; // The room furniture.
	public href: string; // The link to the full details online.

	constructor(room: any) {
		this.fullname = room.fullname;
		this.shortname = room.shortname;
		this.number = room.number;
		this.name = room.name;
		this.address = room.address;
		this.lat = room.lat;
		this.lon = room.lon;
		this.seats = room.seats;
		this.type = room.type;
		this.furniture = room.furniture;
		this.href = room.href;
	}

	public getField?(fieldName: string) {
		let fieldValue: string | number;

		switch (fieldName) {
			case "fullname":
				fieldValue = this.fullname;
				break;
			case "shortname":
				fieldValue = this.shortname;
				break;
			case "number":
				fieldValue = this.number;
				break;
			case "name":
				fieldValue = this.name;
				break;
			case "address":
				fieldValue = this.address;
				break;
			case "lat":
				fieldValue = this.lat;
				break;
			case "lon":
				fieldValue = this.lon;
				break;
			case "seats":
				fieldValue = this.seats;
				break;
			case "type":
				fieldValue = this.type;
				break;
			case "furniture":
				fieldValue = this.furniture;
				break;
			case "href":
				fieldValue = this.href;
				break;
			default:
				fieldValue = "";
		}
		return fieldValue;
	}
}

// HTML DOM nodes from parse5
export interface DomNode {
	nodeName: string;
	tagName?: string;
	value?: string;
	attrs?: Array<{[key: string]: any}>;
	namespaceURI: string;
	childNodes?: DomNode[];
	parentNode?: DomNode;
}
