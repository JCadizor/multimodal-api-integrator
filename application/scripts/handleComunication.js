import api_configurations from '../constants/api_configurations.json'; // Import API settings from JSON file
import {retrieveAsyncStorageDataAsJson} from './utils.js'; // Import utility functions
import {fetch} from 'expo/fetch'; // Importando fetch do expo para garantir compatibilidade

const apiConfigurations = api_configurations.Routes; // Access the API configurations from the JSON file


// chatService.js
// {} dentro dos parametros da função definem que ela receberá um objeto e extrtairá as propriedades dele
export async function startTextToTextStream({ prompt, messages = [], onData, onDone, onError }) {
    let parsedData = await retrieveAsyncStorageDataAsJson();
  if (!parsedData) {
    console.error(' [from HandleCommunications] ❌ Nenhum dado encontrado no AsyncStorage. Verifique se os dados foram salvos corretamente.');
    return;
  }
  
  const apiURl= `http://${parsedData.hostnameAPI_TTS}:${parsedData.portAPI}${apiConfigurations.text_to_text.endpoint_stream}`; // Construct the API URL using the retrieved data
  console.log('📡 [handleComunication.js] STREAM START na URL:', apiURl)  ;
  console.log('📡 [handleComunication.js] a perguntar o prompt:', prompt)  ;
  try {
    const response = await fetch(apiURl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        system: "",
        messages,
      }),
    });

    if (!response.body) {
      throw new Error('ReadableStream não está disponível na resposta');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let startIndex = 0;

    const readChunk = async () => {
      const { done, value } = await reader.read();
      if (done) {
        onDone?.(); // Finalizou o stream
        return;
      }

      const chunk = decoder.decode(value, { stream: true });
      accumulatedText += chunk;

      while (true) {
        const endIndex = accumulatedText.indexOf('\n', startIndex);
        if (endIndex === -1) break;

        const line = accumulatedText.substring(startIndex, endIndex).trim();
        startIndex = endIndex + 1;

        if (line.startsWith('data:')) {
          const jsonString = line.substring(5).trim();
          if (jsonString) {
            try {
              const data = JSON.parse(jsonString);

              if (data.content) {
                onData?.(data.content);
              }

              if (data.done) {
                onDone?.();
              }
            } catch (e) {
              console.error('Erro ao fazer parse do JSON:', e);
            }
          }
        }
      }

      accumulatedText = accumulatedText.substring(startIndex);
      startIndex = 0;

      readChunk();
    };

    readChunk();
  } catch (error) {
    console.error('[handleComunication.js] Erro no stream:', error);
    onError?.(error);
  }
}

export async function stopStream() {
  try {
    const response = await fetch(apiConfigurations.text_to_text.endpoint_stream, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stop: true }),
    });

    if (!response.ok) {
      throw new Error('Erro ao parar o stream');
    }

    console.log('[handleComunication.js] Stream parado com sucesso');
  } catch (error) {
    console.error('[handleComunication.js] Erro ao parar o stream:', error);
  }
}