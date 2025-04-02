import getAppConfig from './config.js'; // Adjust the path if needed

const config = getAppConfig();

// "", "GET"|"POST", "", ""
const fetchData = async (endpoint, actionGetPost, token) => {
    try {
        const response = await fetch(`${config.apiUrl}${endpoint}`, {
            method: actionGetPost,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Credentials': 'true',
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Call Failed:", error);
    }
    return "";
};

export default fetchData;