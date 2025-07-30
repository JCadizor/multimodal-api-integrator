import api_configurations from '../constants/api_configurations.json';
import { retrieveAsyncStorageDataAsJson } from './utils.js';

export async function sendSentimentAnalysis(prompt) {
  let parsedData = await retrieveAsyncStorageDataAsJson();
  if (!parsedData) {
    console.error('❌ Nenhum dado encontrado no AsyncStorage.');
    return null;
  }
  const endpoint = ' http://' +parsedData.hostnameAPI_TTS+':' + parsedData.portAPI+ '/' +api_configurations.Routes.sentiment_analysis.endpoint;
  console.log('[sentimentAnalysis.js] URL:' + endpoint);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (response.ok) {
    const data = await response.json();
    return data; // Retorne apenas os dados
  } else {
    throw new Error('Network response was not ok.');
  }
}