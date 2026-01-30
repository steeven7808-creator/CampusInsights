import {InsightDatasetKind} from "../controller/IInsightFacade";

export interface MetaQuery {
	id: string;
	kind: InsightDatasetKind;
	query: object;
}

// weird experimental stuff below this comment
export interface QueryObject {
	WHERE: WhereObject;
	OPTIONS: OptionsObject;
}

interface WhereObject {
	[key: string]: object;
}

interface OptionsObject {
	COLUMNS: string[];
	ORDER?: DirectionObject | AnyKey;
}

interface DirectionObject {
	dir: "UP" | "DOWN";
	keys: AnyKey[];
}

// enum doesn't really work
enum AnyKey {
	applyKey,
	mKey,
	sKey,
}
