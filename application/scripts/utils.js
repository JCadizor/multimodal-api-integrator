// obter a data do AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { Alert } from 'react-native';
import api_configurations from '../constants/api_configurations.json';

// TTS - Text to Speech
export async function handleTTS(userInput, parsedData, setIsPlaying) {
  console.log('🔊 Processando TTS...');
  
  const apiConfigurations = api_configurations.Routes;
  const TTSendPoint = apiConfigurations.text_to_speech.endpoint;
  const url = `http://${parsedData.hostnameAPI_TTS}:${parsedData.portAPI}${TTSendPoint}`;
  
  console.log('TTS URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: userInput,
        language: 'en',
        voice: 'en-US-JennyNeural',
      }),
    });

    if (!response.ok) {
      throw new Error(`❌ HTTP error! status: ${response.status}`);
    }

    console.log('✅ Comunicação com a API bem sucedida!', response.status);
    
    const arrayBuffer = await response.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');

    // Salvar áudio localmente
    const fileUri = FileSystem.documentDirectory + 'output.mp3';
    await FileSystem.writeAsStringAsync(fileUri, base64String, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log('📁 Áudio salvo em:', fileUri);

    // Reproduzir áudio
    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true }
    );
    
    setIsPlaying(true);
    console.log('🔊 Reproduzindo áudio...');
    
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        setIsPlaying(false);
        console.log('✅ Áudio reproduzido com sucesso!');
      }
    });
    
    await sound.playAsync();
    
  } catch (error) {
    console.error('❌ Erro durante TTS:', error);
    Alert.alert('Erro', 'Erro durante a comunicação com a API de TTS!');
    throw error; // Re-throw para permitir tratamento no componente
  }
}

export async function retrieveAsyncStorageDataAsJson() {
    let parsedData = null;
 try { const retrievedData = await AsyncStorage.getItem('userSettings');
      if (retrievedData) {
        parsedData = JSON.parse(retrievedData);
        console.log('📦 Dados Async storage carregados com sucesso!');} 
        else {console.log('📦 Nenhum dado encontrado no AsyncStorage [Index.js > handleCommunication].');}

      }catch (error) {
        console.error('❌ Erro ao carregar os dados do AsyncStorage [Index.js > handleCommunication]:', error);
        Alert.alert('Erro', 'Erro ao carregar os dados do AsyncStorage!');
      }
        return parsedData;
    }