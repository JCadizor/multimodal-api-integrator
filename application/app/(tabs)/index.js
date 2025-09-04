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
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// IMPORTS LOCAIS
import api_configurations from '../../constants/api_configurations.json';
import ChatComponent from '../../components/chatComponent.js';
import { sendSentimentAnalysis } from '../../scripts/sentimentAnalysis.js';
import { hardware, hardwareLoad } from '../../scripts/hardware.js';
import { handleTTS, handleLanguageDetection } from '../../scripts/utils.js';
import { log } from '../../scripts/simpleLogger.js';

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
        
        log('📦 Dados carregados com sucesso!');
        log('Nome:', parsedData.name);
        log('Email:', parsedData.email);
        log('Hostname API:', parsedData.hostnameAPI_TTS);
        log('Porta API:', parsedData.portAPI);
        log('Hostname MQTT:', parsedData.hostnameMQTT);
      } else {
        log('📦 Nenhum dado encontrado no AsyncStorage [Index.js > initializeConfigValues].');
      }
    }
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] ❌ Erro ao carregar os dados! [Index.js > initializeConfigValues]`, error);
  }
};


export default function HomeScreen() {
  // NAVEGAÇÃO
  const navigation = useNavigation();
  
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
    log('Inicializando valores de configuração...');
    initializeConfigValues();
  }, []);

  // FUNÇÕES DE NAVEGAÇÃO PARA O CHAT
  const navigateToTextChat = () => {
    console.log('Navegando para chat em modo texto...');
    navigation.navigate('chatRoom', { initialMode: 'text' });
  };

  const navigateToVoiceChat = () => {
    console.log('Navegando para chat em modo voz...');
    navigation.navigate('chatRoom', { initialMode: 'voice' });
  };



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
        await handleLanguageDetectionLocal();
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
  const handleLanguageDetectionLocal = async () => {
    try {
      const result = await handleLanguageDetection(userInput, parsedData);
      Alert.alert('Idioma Detectado', result.name);
    } catch (error) {
      // Erro já foi tratado na função handleLanguageDetection
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

  // CARREGAMENTO INICIAL
  useEffect(() => {
    console.log('Inicializando valores de configuração...');
    initializeConfigValues();
  }, []);

  // RENDER DO COMPONENTE
  return (
    <ImageBackground source={require('../../assets/images/cropped-isep.jpg')} style={styles.image}>
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          <View style={styles.optionsGrid}>
            
            {/* MENU DEBUG (apenas se debugMode = true) */}
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

            {/* BOTÕES PRINCIPAIS */}
            <View style={styles.chatButtonsContainer}>
              {/* Botão Chat Texto */}
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={navigateToTextChat}
              >
                <MaterialIcons name="chat" size={32} color="#007AFF" />
                <Text style={styles.chatButtonText}>Chat Texto</Text>
              </TouchableOpacity>
              
              {/* Botão Chat Voz */}
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={navigateToVoiceChat}
              >
                <MaterialIcons name="mic" size={32} color="#FF6B35" />
                <Text style={styles.chatButtonText}>Chat Voz</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CHAT COMPONENT */}
          {isChatVisible && <ChatComponent />}
        </View>

        {/* MODAL PARA INPUT DO USUÁRIO */}
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

        {/* OVERLAY DE REPRODUÇÃO DE ÁUDIO */}
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

// ESTILOS DO COMPONENTE
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
  chatButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  chatButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
    marginHorizontal: 10,
  },
  chatButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});