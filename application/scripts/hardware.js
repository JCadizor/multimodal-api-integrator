import api_configurations from '../constants/api_configurations.json'; // Import API settings from JSON fileimport api_configurations from '../constants/api_configurations.json'; // Import API settings from JSON file
import {fetch} from 'expo/fetch'; // Importando fetch do expo para garantir compatibilidade

const apiConfigurations = api_configurations.Routes; // Access the API configurations from the JSON file

export async function hardware(path) {
    
    const apiUrl = apiConfigurations.system_loading.endpoint; // Get the hardware API URL from the configurations
    const fullURL= 'http://' + path + apiUrl; // Construct the full URL with the provided path
    console.log('url: http://' + path + apiUrl);
    try {
        const response = await fetch(fullURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add any additional headers if required
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch hardware data');
        }

        const data = await response.json();
        console.log('Hardware data fetched successfully:', data);
        return data;
    } catch (error) {
        console.error('[hardware.js]:Error fetching hardware data:', error);
        throw error;
    }
}

export async function hardwareLoad(path){
    const apiUrl = apiConfigurations.system_loading.endpoint_load; // Get the hardware API URL from the configurations
    const fullURL= 'http://' + path + apiUrl; // Construct the full URL with the provided path
    console.log('url: http://' + path + apiUrl);
    try {
        const response = await fetch(fullURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add any additional headers if required
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch hardware Load data');
        }

        const data = await response.json();
        console.log('Hardware Load data fetched successfully:', data);
        return data;
    } catch (error) {
        console.error('[hardware.js]:Error fetching hardware Load data:', error);
        throw error;
    }
}