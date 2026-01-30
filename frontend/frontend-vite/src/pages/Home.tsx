import axios from "axios";
import {NavigationBar} from "../component/NavigationBar";
import {useEffect} from "react";

export function Home() {

	useEffect(() => {
		document.body.style.background = `url(dog2.jpg)`

		// send pair.zip to backend with axios

		// Function to send PUT request
        const sendPutRequest = async () => {
            try {
                // Fetch the file from the public directory
                const response = await fetch('/pair.zip');
                const blob = await response.blob();

                // Axios PUT request
                const axiosResponse = await axios.put('http://localhost:4321/dataset/sections/sections', blob, {
                    headers: {
                        'Content-Type': 'application/x-zip-compressed'
                    }
                });

                // Handle response
                console.log('Axios Response:', axiosResponse.data);
                if (axiosResponse.status === 200) {
                    console.log("Upload successful:", axiosResponse.data.result);
                }
            } catch (error) {
                // data already added
            }
        };

        // Call the function
        sendPutRequest();
	}, []);

	return (
		<div>
			<NavigationBar />
			<h2 style={{color: "black"}}>Home</h2>
			<p style={{color: "black"}}>
				Hello World!
			</p>
		</div>
	)
}
