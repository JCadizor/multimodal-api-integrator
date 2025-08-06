import React, { useEffect, useState } from 'react';
import { 
  ImageBackground, 
  StyleSheet, 
  Text, 
  View, 
  Button, 
  Alert, 
  TextInput, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTS LOCAIS
import api_configurations from '../../constants/api_configurations.json';
import ChatComponent from '../../components/chatComponent.js';
import { sendSentimentAnalysis } from '../../scripts/sentimentAnalysis.js';
import { hardware, hardwareLoad } from '../../scripts/hardware.js';
import { handleTTS } from '../../scripts/utils.js';

// CONFIGURAÇÕES GLOBAIS
const apiConfigurations = api_configurations.Routes;
const parsedData = {};
const debugMode = false;

// FUNÇÃO DE INICIALIZAÇÃO - Carrega configurações do AsyncStorage
const initializeConfigValues = async () => {
  try {
    const savedData = await AsyncStorage.getItem('userSettings');
    
    if (savedData) {
      const newParsedData = JSON.parse(savedData);
      
      if (newParsedData) {
        Object.assign(parsedData, newParsedData);
        
        console.log('📦 Dados carregados com sucesso!');
        console.log('Nome:', parsedData.name);
        console.log('Email:', parsedData.email);
        console.log('Hostname API:', parsedData.hostnameAPI_TTS);
        console.log('Porta API:', parsedData.portAPI);
        console.log('Hostname MQTT:', parsedData.hostnameMQTT);
      } else {
        console.log('📦 Nenhum dado encontrado no AsyncStorage [Index.js > initializeConfigValues].');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar os dados! [Index.js > initializeConfigValues]', error);
  }
};


export default function HomeScreen() {
  // ESTADOS DO COMPONENTE
  const [isModalVisible, setModalVisible] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [sttTextoReconhecido, setSttTextoReconhecido] = useState('');
  const [communicationOption, setCommunicationOption] = useState('');
  const [chat, setChat] = useState([]);
  const [currentReply, setCurrentReply] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);

  // CARREGAMENTO INICIAL
  useEffect(() => {
    console.log('Inicializando valores de configuração...');
    initializeConfigValues();
  }, []);



  // FUNÇÃO PRINCIPAL - Gerencia chamadas para APIs
  const handleAPICalls = async (option) => {
    console.log('Opção selecionada:', option);
    
    // Validação de input para opções que requerem texto
    if (!userInput && (option === 'TTS' || option === 'LD')) {
      console.log('❌ User input vazio');
      Alert.alert('Erro', 'Por favor, insira um texto!');
      return;
    }

    console.log('User Input:', userInput);

    switch (option) {
      // TEXT TO SPEECH
      case 'TTS':
        await handleTTSLocal();
        break;

      // SPEECH TO TEXT  
      case 'STT':
        await handleSTT();
        break;

      // LANGUAGE DETECTION
      case 'LD':
        await handleLanguageDetection();
        break;

      // SENTIMENT ANALYSIS
      case 'SA':
        await handleSentimentAnalysis();
        break;

      // HARDWARE STATUS
      case 'Hardware':
        await handleHardware();
        break;

      default:
        setModalVisible(false);
        console.log('❌ Opção inválida');
    }
  };

  // TTS - Text to Speech
  const handleTTSLocal = async () => {
    try {
      await handleTTS(userInput, parsedData, setIsPlaying);
      setModalVisible(false);
    } catch (error) {
      // Erro já foi tratado na função handleTTS
      setModalVisible(false);
    }
  };

  // STT - Speech to Text
  const handleSTT = async () => {
    console.log('🎤 Processando STT...');
    
    const STTendPoint = apiConfigurations.speech_to_text.endpoint;
    const url = `http://${parsedData.hostnameAPI_TTS}:${parsedData.portAPI}${STTendPoint}`;
    
    console.log('STT URL:', url);

    try {
      // Carregar arquivo de áudio dos assets
      const asset = Asset.fromModule(require('../../assets/Speech_to_text_sample.wav'));
      await asset.downloadAsync();
      const fileUri = asset.localUri;
      
      if (!fileUri) {
        throw new Error('❌ Ficheiro de áudio não encontrado!');
      }

      // Preparar FormData
      const formData = new FormData();
      formData.append('language', 'en');
      formData.append('model_size', 'base.en');
      formData.append('file', {
        uri: fileUri,
        name: 'Speech_to_text_sample.wav',
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

      const transcript = result?.segments?.map(seg => seg.text.trim()).join(' ') || 'Sem conteúdo detectado.';
      setSttTextoReconhecido(transcript);
      Alert.alert('Texto Reconhecido', transcript);

    } catch (error) {
      console.error('❌ Erro ao processar STT:', error);
      Alert.alert('Erro', 'Erro ao enviar o áudio para transcrição.');
    }
  };

  // Language Detection
  const handleLanguageDetection = async () => {
    console.log('🌍 Processando Language Detection...');
    
    const LDendPoint = apiConfigurations.laguage_detector.endpoint;
    const url = `http://${parsedData.hostnameAPI_TTS}:${parsedData.portAPI}${LDendPoint}`;
    
    console.log('LD URL:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userInput }),
      });

      if (!response.ok) {
        throw new Error(`❌ HTTP error! status: ${response.status}`);
      }

      console.log('✅ Comunicação com a API bem sucedida!', response.status);
      
      const result = await response.json();
      const languageName = apiConfigurations.languageMap[result.language] || result.language;
      
      Alert.alert('Idioma Detectado', languageName);

    } catch (error) {
      console.error('❌ Erro durante Language Detection:', error);
      Alert.alert('Erro', 'Erro durante a detecção de idioma!');
    }
    
    setModalVisible(false);
  };

  // Sentiment Analysis
  const handleSentimentAnalysis = async () => {
    console.log('😊 Processando Sentiment Analysis...');
    
    try {
      const response = await sendSentimentAnalysis(userInput);
      console.log('✅ Resposta da API de Análise de Sentimento:', response);
    } catch (error) {
      console.error('❌ Erro na Análise de Sentimento:', error);
      Alert.alert('Erro', 'Erro durante a análise de sentimento!');
    }
  };

  // Hardware Status
  const handleHardware = async () => {
    console.log('💻 Consultando status do Hardware...');
    
    try {
      const path = `${parsedData.hostnameAPI_TTS}:${parsedData.portAPI}`;
      const hardwareData = await hardware(path);
      const hardwareLoadData = await hardwareLoad(path);

      if (hardwareData && hardwareLoadData) {
        Alert.alert(
          'Dados de Hardware',
          JSON.stringify({ hardwareData, hardwareLoadData }, null, 2)
        );
      }
    } catch (error) {
      console.error('❌ Erro ao consultar hardware:', error);
      Alert.alert('Erro', 'Erro ao consultar status do hardware!');
    }
  };

  // 📚 CARREGAMENTO INICIAL
  useEffect(() => {
    console.log('Inicializando valores de configuração...');
    initializeConfigValues();
  }, []);

  // 🎨 RENDER DO COMPONENTE
  return (
    <ImageBackground source={require('../../assets/images/cropped-isep.jpg')} style={styles.image}>
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          <View style={styles.optionsGrid}>
            
            {/* 🐛 MENU DEBUG (apenas se debugMode = true) */}
            {debugMode && (
              <View name ="debugMenu">
                <Button
                  title="Comunicar Text to Speech"
                  onPress={() => {
                    setModalVisible(true);
                    setCommunicationOption("TTS");
                  }}
                />
                <Button
                  title="Sentiment Analysis"
                  onPress={() => {
                    setModalVisible(true);
                    setCommunicationOption("SA");
                    handleAPICalls('SA');
                  }}
                />
                <Button
                  title="Speech to Text"
                  onPress={() => handleAPICalls('STT')}
                />
                <Button
                  title="Show Hardware"
                  onPress={() => {
                    setCommunicationOption("Hardware");
                    handleAPICalls('Hardware');
                  }}
                />
                <Button
                  title="Deteção de Linguagem"
                  onPress={() => {
                    setModalVisible(true);
                    setCommunicationOption("LD");
                  }}
                />
              </View>
            )}

            {/* 🚀 BOTÕES PRINCIPAIS */}
            <Button
              title="Falar com o Assistente (Texto)"
              onPress={() => {
                setModalVisible(true);
                setCommunicationOption("text");
                setUserInput('');
              }}
            />
            <Button
              title="Falar com o Assistente (Voz)"
              onPress={() => handleAPICalls('STT')}
            />
          </View>

          {/* 💬 CHAT COMPONENT */}
          {isChatVisible && <ChatComponent />}
        </View>

        {/* 📱 MODAL PARA INPUT DO USUÁRIO */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Digite algo:</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite algo..."
                placeholderTextColor="grey"
                value={userInput}
                onChangeText={setUserInput}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleAPICalls(communicationOption)}
                >
                  <Text style={styles.buttonText}>Enviar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 🔊 OVERLAY DE REPRODUÇÃO DE ÁUDIO */}
        {isPlaying && (
          <View style={styles.overlay}>
            <View style={styles.overlayContent}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.overlayText}>🔊 Reproduzindo áudio...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

// 🎨 ESTILOS DO COMPONENTE
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    margin: 10,
    borderRadius: 10,
  },
  image: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  optionsGrid: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
    color: 'black',
    backgroundColor: 'white',
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF0000',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  overlayText: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});