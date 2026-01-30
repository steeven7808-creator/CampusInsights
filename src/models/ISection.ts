import {SectionData} from "./IModel";

export interface SectionQuery {
	result: Section[];
	rank: number;
}

export interface Section {
	tier_eighty_five: number;
	tier_ninety: number;
	Title: string;
	Section: string;
	Detail: string;
	tier_seventy_two: number;
	Other: number;
	Low: number;
	tier_sixty_four: number;
	id: number;
	tier_sixty_eight: number;
	tier_zero: number;
	tier_seventy_six: number;
	tier_thirty: number;
	tier_fifty: number;
	Professor: string;
	Audit: number;
	tier_g_fifty: number;
	tier_forty: number;
	Withdrew: number;
	Year: string;
	tier_twenty: number;
	Stddev: number;
	Enrolled: number;
	tier_fifty_five: number;
	tier_eighty: number;
	tier_sixty: number;
	tier_ten: number;
	High: number;
	Course: string;
	Session: string;
	Pass: number;
	Fail: number;
	Avg: number;
	Campus: string;
	Subject: string;
}

export class SectionClass implements SectionData {
	public uuid: string;
	public id: string;
	public title: string;
	public instructor: string;
	public dept: string;
	public year: number;
	public avg: number;
	public pass: number;
	public fail: number;
	public audit: number;

	constructor(section: any) {
		// passing either Section or SectionPruned; SectionPruned wouldn't have a field of Course
		if (isSectionPruned(section)) {
			this.uuid = section.uuid;
			this.id = section.id;
			this.title = section.title;
			this.instructor = section.instructor;
			this.dept = section.dept;
			this.year = section.year;
			this.avg = section.avg;
			this.pass = section.pass;
			this.fail = section.fail;
			this.audit = section.audit;
		} else {
			this.uuid = section.id.toString();
			this.id = section.Course;
			this.title = section.Title;
			this.instructor = section.Professor;
			this.dept = section.Subject;
			this.year = Number(section.Year);
			this.avg = section.Avg;
			this.pass = section.Pass;
			this.fail = section.Fail;
			this.audit = section.Audit;
		}
	}

	public getField(fieldName: string) {
		let fieldValue: string | number;

		switch (fieldName) {
			case "uuid":
				fieldValue = this.uuid;
				break;
			case "id":
				fieldValue = this.id;
				break;
			case "title":
				fieldValue = this.title;
				break;
			case "instructor":
				fieldValue = this.instructor;
				break;
			case "dept":
				fieldValue = this.dept;
				break;
			case "year":
				fieldValue = this.year;
				break;
			case "avg":
				fieldValue = this.avg;
				break;
			case "pass":
				fieldValue = this.pass;
				break;
			case "fail":
				fieldValue = this.fail;
				break;
			case "audit":
				fieldValue = this.audit;
				break;
			default:
				fieldValue = "";
		}

		return fieldValue;
	}
}

function isSectionPruned(section: any) {
	return section.Course === undefined;
}
