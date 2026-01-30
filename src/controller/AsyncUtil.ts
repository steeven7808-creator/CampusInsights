import {InsightError} from "./IInsightFacade";

export function makeAsync(syncFn: (...args: any[]) => any, err: string, ...args: any[]){
	return new Promise((resolve, reject) => {
		const result = syncFn(...args);
		if (result) {
			resolve(result);
		} else {
			reject(new InsightError(err));
		}
	});
}
