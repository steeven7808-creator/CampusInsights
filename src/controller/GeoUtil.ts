import request from "http";
import * as http from "http";
import {GeoResponse} from "../models/IGeoResponse";
import {InsightError} from "./IInsightFacade";

const BASE_URL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team";
const TEAM_NUMBER = "279";

export async function fetchGeoLocation(address: string): Promise<GeoResponse> {
	const encodedAddress = encodeURIComponent(address);
	const urlString = `${BASE_URL}${TEAM_NUMBER}/${encodedAddress}`;

	return new Promise<GeoResponse>((resolve, reject) => {
		// Perform HTTP GET request
		http.get(urlString, (res) => {
			res.setEncoding("utf8");
			let data = "";

			// A chunk of data has been received.
			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				// Parse the response JSON
				let response: GeoResponse;
				try {
					response = JSON.parse(data);
					resolve(response);
				} catch (error) {
					// console.error("Error parsing response JSON:", error);
					reject(new InsightError((error as Error).message));
				}
			});
		})
			.on("error", (error) => {
				// console.error("Error making GET request:", error.message);
				reject(new InsightError(error.message));
			});
	});
}
