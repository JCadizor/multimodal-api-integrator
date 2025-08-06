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
  
  // Usar voz selecionada nas configurações ou fallback para Jenny
  const selectedVoice = parsedData.selectedVoice || 'en-US-JennyNeural';
  
  // Determinar idioma baseado na voz selecionada
  const language = selectedVoice.startsWith('pt-') ? 'pt' : 'en';
  
  console.log('TTS URL:', url);
  console.log('🔊 Voz selecionada:', selectedVoice);
  console.log('🌍 Idioma determinado:', language);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: userInput,
        language: language,
        voice: selectedVoice,
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
    
    if (setIsPlaying) {
      setIsPlaying(true);
    }
    console.log('🔊 Reproduzindo áudio...');
    
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        if (setIsPlaying) {
          setIsPlaying(false);
        }
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

// STT - Speech to Text
export async function handleSTT(audioUri, parsedData) {
  console.log('🎤 Processando STT...');
  
  const apiConfigurations = api_configurations.Routes;
  const STTendPoint = apiConfigurations.speech_to_text.endpoint;
  const url = `http://${parsedData.hostnameAPI_TTS}:${parsedData.portAPI}${STTendPoint}`;
  
  // Usar modelo selecionado nas configurações ou fallback para base
  const selectedModel = parsedData.selectedSTTModel || 'base';
  // Usar idioma padrão das configurações ou fallback para português
  const defaultLang = parsedData.defaultLanguage || 'pt';
  
  console.log('STT URL:', url);
  console.log('🎤 Modelo STT selecionado:', selectedModel);
  console.log('🌍 Idioma padrão:', defaultLang);

  try {
    // Preparar FormData
    const formData = new FormData();
    formData.append('language', defaultLang); // Usar idioma padrão configurado
    formData.append('model_size', selectedModel); // Usar modelo selecionado
    formData.append('file', {
      uri: audioUri,
      name: 'audio_recording.wav',
      type: 'audio/wav',
    });

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Erro da API: ${result.message || response.status}`);
    }

    console.log('📝 Resposta da STT:', result);

    // Extrair texto transcrito
    const transcript = result?.segments?.map(seg => seg.text.trim()).join(' ') || 'Sem conteúdo detectado.';
    
    console.log('✅ Texto transcrito:', transcript);
    return transcript;

  } catch (error) {
    console.error('❌ Erro ao processar STT:', error);
    Alert.alert('Erro', 'Erro ao enviar o áudio para transcrição.');
    throw error;
  }
}

// STT com idioma específico - Speech to Text with Language Detection
export async function handleSTTWithLanguage(audioUri, parsedData, languageCode) {
  console.log('🎤 Processando STT com idioma específico:', languageCode);
  
  const apiConfigurations = api_configurations.Routes;
  const STTendPoint = apiConfigurations.speech_to_text.endpoint;
  const url = `http://${parsedData.hostnameAPI_TTS}:${parsedData.portAPI}${STTendPoint}`;
  
  // Usar modelo selecionado nas configurações ou fallback para base
  const selectedModel = parsedData.selectedSTTModel || 'base';
  
  console.log('STT URL:', url);
  console.log('🎤 Modelo STT selecionado:', selectedModel);

  try {
    // Preparar FormData com idioma detectado
    const formData = new FormData();
    formData.append('language', languageCode); // Usar idioma detectado
    formData.append('model_size', selectedModel); // Usar modelo selecionado
    formData.append('file', {
      uri: audioUri,
      name: 'audio_recording.wav',
      type: 'audio/wav',
    });

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Erro da API: ${result.message || response.status}`);
    }

    console.log('📝 Resposta da STT (com idioma específico):', result);

    // Extrair texto transcrito
    const transcript = result?.segments?.map(seg => seg.text.trim()).join(' ') || 'Sem conteúdo detectado.';
    
    console.log('✅ Texto transcrito (idioma específico):', transcript);
    return transcript;

  } catch (error) {
    console.error('❌ Erro ao processar STT com idioma específico:', error);
    Alert.alert('Erro', 'Erro ao enviar o áudio para transcrição com idioma específico.');
    throw error;
  }
}

// Language Detection
export async function handleLanguageDetection(textInput, parsedData) {
  console.log('🌍 Processando Language Detection...');
  
  const apiConfigurations = api_configurations.Routes;
  const LDendPoint = apiConfigurations.laguage_detector.endpoint;
  const url = `http://${parsedData.hostnameAPI_TTS}:${parsedData.portAPI}${LDendPoint}`;
  
  console.log('LD URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textInput }),
    });

    if (!response.ok) {
      throw new Error(`❌ HTTP error! status: ${response.status}`);
    }

    console.log('✅ Comunicação com a API bem sucedida!', response.status);
    
    const result = await response.json();
    const languageCode = result.language;
    const languageName = apiConfigurations.languageMap[languageCode] || languageCode;
    
    console.log('✅ Idioma detectado:', languageCode, '->', languageName);
    
    return {
      code: languageCode,
      name: languageName,
      raw: result
    };

  } catch (error) {
    console.error('❌ Erro durante Language Detection:', error);
    Alert.alert('Erro', 'Erro durante a detecção de idioma!');
    throw error;
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