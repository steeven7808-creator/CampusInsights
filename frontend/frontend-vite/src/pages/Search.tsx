import {NavigationBar} from "../component/NavigationBar";
import {
	Autocomplete,
	Button,
	Divider,
	FormControl,
	FormControlLabel,
	FormLabel,
	Grid,
	InputLabel,
	MenuItem,
	Paper,
	Radio,
	RadioGroup,
	Select,
	TextField,
	Typography,
} from "@mui/material";
import {Fragment, useEffect, useState} from "react";
import axios from "axios";

interface Section {
	sections_uuid: string;
	sections_id: string;
	sections_title: string;
	sections_instructor: string;
	sections_dept: string;
	sections_year: number;
	sections_avg: number;
	sections_pass: number;
	sections_fail: number;
	sections_audit: number;
}

interface AutoComplete {
	label: string;
	value: Section[];
}

const groupByInstructor = (data: Section[]): AutoComplete[] => {
	const result: Record<string, Section[]> = {};

	data.forEach((section) => {
		// Split the instructor names by comma
		const instructors = section.sections_instructor.split(";");

		instructors.forEach((instructor) => {
			if (!result[instructor]) {
				result[instructor] = [];
			}
			result[instructor].push(section);
		});
	});

	return Object.keys(result)
		.sort()
		.map((instructor) => ({
			label: instructor,
			value: result[instructor],
		}));
};

const groupByDepartment = (data: Section[]): AutoComplete[] => {
	const result: Record<string, Section[]> = {};

	data.forEach((section) => {
		const department = section.sections_dept;

		if (!result[department]) {
			result[department] = [];
		}
		result[department].push(section);
	});

	return Object.keys(result)
		.sort()
		.map((dept) => ({
			label: dept,
			value: result[dept],
		}));
};

// const groupedProfessorData = groupByInstructor(professorData);
// const groupedDepartmentData = groupByDepartment(departmentData);

function inputQuery(name: string, searchType: string) {

	let whereClause = {};

    // Conditionally set the appropriate property
    if (searchType === "professor") {
        whereClause = {
            IS: { "sections_instructor": `*${name}*` }
        };
    } else {
        whereClause = {
            IS: { "sections_dept": `*${name}*` }
        };
    }


	return {
		WHERE: whereClause,
		OPTIONS: {
			COLUMNS: [
				"sections_uuid",
				"sections_id",
				"sections_title",
				"sections_instructor",
				"sections_dept",
				"sections_year",
				"sections_avg",
				"sections_pass",
				"sections_fail",
				"sections_audit",
			],
			ORDER: "sections_avg",
		},
	};
}

export function Search() {
	const [searchType, setSearchType] = useState("");
	const [deptYear, setDeptYear] = useState<string>("All");
	const [userInput, setUserInput] = useState<string | null>(null);
	const [searchedData, setSearchedData] = useState<Section[] | null>(null);
	const [isError, setIsError] = useState(false);
	const [courseSelected, setCourseSelected] = useState<string>("all");

	const [jsonResult, setJsonResult] = useState<Section[]>([]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchType((event.target as HTMLInputElement).value);
		setUserInput(null);
		setSearchedData(null);
		setIsError(false);
		setCourseSelected("all");
		setDeptYear("All");
	};

	function groupedData() : AutoComplete[]{
		if (searchType === "professor") {
			return groupByInstructor(jsonResult);
		} else if (searchType === "department") {
			return groupByDepartment(jsonResult);
		}
		return [];
	}

	const handleSearch = () => {
		let foundData = null;

		if (searchType === "professor") {
			groupedData().forEach((professor) => {
				if (professor.label === userInput) {
					foundData = professor.value;
				}
			});
		} else if (searchType === "department") {
			groupedData().forEach((department) => {
				if (department.label === userInput) {
					foundData = department.value;
				}
			});
		}

		console.log(foundData);

		setSearchedData(foundData);

		// Set isError to true if no data is found (i.e., foundData is null)
		setIsError(foundData === null && userInput !== null);
	};

	useEffect(() => {

		const fetchData = async () => {
            if (userInput && userInput.length > 2) {
                try {
                    const response = await axios.post('http://localhost:4321/query', inputQuery(userInput, searchType));

                    setJsonResult(response.data.result);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        };

        fetchData();

		if (isError) {
			document.body.style.background = `url(popo.gif)`;
		} else {
			switch (searchType) {
				case "department":
					document.body.style.background = `url(hotwheels.jpg)`;
					break;
				case "professor":
					document.body.style.background = `url(fire2.jpg)`;
					break;

				default:
					document.body.style.background = `url(fire.jpg)`;
					break;
			}
		}




	}, [searchType, isError, searchedData, userInput]);

	// Filtered data based on course and year
	const filteredData = searchedData?.filter(
		(section) =>
			(courseSelected === "all" || section.sections_id === courseSelected) &&
			(searchType !== "department" || deptYear === "All" || section.sections_year.toString() === deptYear)
	);

	useEffect(() => {
		if (filteredData && filteredData.length === 0) {
			setIsError(true);
		} else {
			setIsError(false);
		}
	}, [filteredData]);

	return (
		<div>
			<NavigationBar />
			<h2>Search</h2>

			<Paper
				sx={{
					display: "flex",
					alignItems: "center",
					padding: 1,
				}}
			>
				<Grid>
					<Grid item>
						<FormControl>
							<FormLabel id="search-type">Search Type</FormLabel>
							<RadioGroup
								row
								aria-labelledby="search-type"
								name="controlled-radio-buttons-group"
								value={searchType}
								onChange={handleChange}
							>
								<FormControlLabel value="professor" control={<Radio />} label="Professor" />
								<FormControlLabel value="department" control={<Radio />} label="Department" />
							</RadioGroup>
						</FormControl>
					</Grid>

					<Grid item container>
						<Autocomplete
							// value={userInput ? { label: userInput } as AutoComplete : null}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									handleSearch();
								}
							}}
							clearOnBlur={false}
							disablePortal
							id="combo-box-demo"
							onInputChange={(_event, value: string | null) => {
								setUserInput(value);
								setSearchedData(null);
								setIsError(false);
								setCourseSelected("all");
							}}
							options={
								userInput && userInput.length >= 2
									? searchType === "professor"
										? groupedData()
										: searchType === "department"
										? groupedData()
										: []
									: [] // Provide empty options if input length is less than 2
							}
							sx={{width: 300}}
							renderInput={(params) => (
								<TextField {...params} label={searchType === "" ? "Choose Search Type" : searchType} />
							)}
							disabled={searchType === ""}
							noOptionsText={"👁️👄👁️"}
						/>
						{searchType === "department" && (
							<TextField
								id="department-year"
								label="Year"
								value={deptYear}
								type="string"
								onChange={(event) => {
									if (event.target.value === "") {
										setDeptYear("All");
										return;
									}
									setDeptYear(event.target.value);
								}}
							/>
						)}

						<Button
							type={"submit"}
							variant="contained"
							disabled={searchType === "" || userInput === null}
							onClick={handleSearch}
							sx={{
								padding: "15px",
							}}
						>
							{" "}
							Search{" "}
						</Button>
					</Grid>

					{isError && (
						<Grid
							item
							mt={2}
							sx={{
								backgroundImage: `url(popo.jpg)`,
							}}
						>
							{/*BOLD RED TEXT ABOUT INVALID CHARACTERS ENTERED*/}
							<Typography variant="h6" color="fuchsia">
								Invalid Search Parameter
							</Typography>
							<Typography variant="h1" color="red" fontWeight={"bold"}>
								ENTER A ONE THAT EXISTS IN THE DATABASE
							</Typography>
						</Grid>
					)}
				</Grid>
			</Paper>

			{searchedData && !isError && (
				<Paper
					sx={{
						padding: 1,
						marginTop: 1,
					}}
				>
					<FormControl fullWidth>
						<InputLabel>Course</InputLabel>
						<Select
							label={"Course"}
							value={courseSelected}
							onChange={(event) => {
								setCourseSelected(event.target.value as string);
							}}
						>
							<MenuItem value={"all"}>All</MenuItem>
							{
								// Create a unique set of courses based on sections_id
								Array.from(new Set(searchedData.map((section) => section.sections_id)))
									.sort((a, b) => a.localeCompare(b)) // Sort if needed
									.map((id) => {
										// Find the first section that matches this id
										const section = searchedData.find((s) => s.sections_id === id);
										return (
											<MenuItem key={section?.sections_id} value={section?.sections_id}>
												{section?.sections_id}
											</MenuItem>
										);
									})
							}
						</Select>
					</FormControl>
				</Paper>
			)}

			{searchedData && !isError && (
				<Paper sx={{padding: 1, marginTop: 1, maxHeight: "50vh", overflow: "auto"}}>
					{searchedData
						// TODO: change this year filtering, set up this way for the video demo
						.filter(
							(section) =>
								(courseSelected === "all" || section.sections_id === courseSelected) &&
								(searchType !== "department" ||
									deptYear === "All" ||
									section.sections_year.toString() === deptYear) // Add year filter for department
						)
						.map((section) => (
							<Fragment key={section.sections_uuid}>
								<Grid item sx={{padding: 2}}>
									<Grid item>
										<u>Course ID</u>: {section.sections_id}
									</Grid>
									<Grid item>
										<u>Title</u>: {section.sections_title}
									</Grid>

									<Grid item>
										<u>Audit</u>: {section.sections_audit}
									</Grid>
									<Grid item>
										<u>Average</u>: {section.sections_avg}
									</Grid>
									<Grid item>
										<u>Department</u>: {section.sections_dept}
									</Grid>
									<Grid item>
										<u>Fail</u>: {section.sections_fail}
									</Grid>

									<Grid item>
										<u>Pass</u>: {section.sections_pass}
									</Grid>
									<Grid item>
										<u>Year</u>: {section.sections_year}
									</Grid>
									<Grid item>
										<u>Instructor(s)</u>: <br />
										{section.sections_instructor.split(";").map((instructor, index) => (
											<Fragment key={section.sections_uuid + "-" + index}>
												{" "}
												{/* Unique key for each instructor */}
												{instructor}
												<br />
											</Fragment>
										))}
									</Grid>
								</Grid>
								<Divider />
							</Fragment>
						))}
				</Paper>
			)}
		</div>
	);
}
