import {Grid} from "@mui/material";

export function NavigationBar() {
	return (
		<Grid container direction={"row"} spacing={2} sx={{
			justifyContent: "center",
			padding: 2,
			marginBottom: 2,
			borderRadius: 2,
			"& a": {
				color: "white",
				backgroundColor: "black",
				padding: 1,
				borderRadius: 20,
				fontSize: "1.5rem",
				"&:hover": {
					textDecoration: "underline"
				}
			},

		}}>
			<Grid item>
			<a href="/">Home</a>
			</Grid>
			<Grid item>
			<a href="/search">Search</a>
			</Grid>

		</Grid>
	)
}
