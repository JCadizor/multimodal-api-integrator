import React, { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api_configurations from '../../constants/api_configurations.json'; // Import API settings from JSON file
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';
import {Asset} from 'expo-asset'; // Import Asset for loading local files
import { ImageBackground,  StyleSheet,  Text,View,  Button,Alert,TextInput,Modal, TouchableOpacity,ActivityIndicator} from 'react-native';
import ChatComponent from'../../components/chatComponent.js'; // Import chat component for text to text communication
import {sendSentimentAnalysis} from '../../scripts/sentimentAnalysis.js'; // Import sentiment analysis script
import {hardware, hardwareLoad} from '../../scripts/hardware.js';

const apiConfigurations = api_configurations.Routes; // Access the API configurations from the JSON file
const parsedData = {}; // Initialize parsedData to store configuration values

const debugMode = false; // Default value for debug mode

const initializeConfigValues = async () => {

  try {
    let savedData = await AsyncStorage.getItem('userSettings');
    if (savedData) {
      const newParsedData = JSON.parse(savedData);
      if (newParsedData) {
        Object.assign(parsedData, newParsedData); // Merge newParsedData into parsedData

      console.log('📦 Dados carregados com sucesso!');
      console.log('Nome: ' + parsedData.name);
      console.log('Email: ' + parsedData.email);
      console.log('Hostname API: ' + parsedData.hostnameAPI_TTS);
      console.log('Porta API: ' + parsedData.portAPI);
      console.log('Hostname MQTT: ' + parsedData.hostnameMQTT);
      }
      else {
        console.log('📦 Nenhum dado encontrado no AsyncStorage [Index.js > initializeConfigValues].');
      }
    }
  } catch (error) {
    console.error("❌ Erro ao carregar os dados![Index.js > initializeConfigValues]", error);
  }
  
}


export default function HomeScreen() {

  
  const [isModalVisible, setModalVisible] = useState(false); // State to control modal visibility
  const [userInput, setUserInput] = useState(''); // State to store user input
  const [isPlaying, setIsPlaying] = useState(false);
  const [sttTextoReconhecido, setsttTextoReconhecido] = useState('');
  const [communicationOption, setCommunicationOption] = useState(''); // State to store the selected communication option
  const [chat, setChat] = useState([]);
  const [currentReply, setCurrentReply] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false); // State to control chat visibility



  const handleAPICalls = async (option) => {
    console.log('variavel option:', option);
    if (!userInput && (option == 'TTS'|| option == 'LD')) {
      console.log('❌ user input vazio');
      Alert.alert('Erro', 'Por favor, insira um texto!');
      return;
    }

    // import AsyncStorage from '@react-native-async-storage/async-storage';
    // Retrieve the saved data from AsyncStorage

    
    console.log('User Input:', userInput);

    switch (option) {
      /////////////////////////////// TTS (Text to Speech) ////////////////////////////////////////
      case 'TTS':
        console.log('Opção: TTS');
        const TTSendPoint = apiConfigurations.text_to_speech.endpoint; // Get the TTS endpoint from the JSON file

        console.log('Comunicar TTS:'+ TTSendPoint);
        
        console.log('TTS Endpoint:', TTSendPoint);
        console.log('url: http://' +parsedData.hostnameAPI_TTS+':' + parsedData.portAPI+ TTSendPoint);

        try {
        const response = await fetch(`http://${parsedData.hostnameAPI_TTS}:${parsedData.portAPI}${TTSendPoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              text: userInput,
              language: 'en',
              voice: 'en-US-JennyNeural',
          }),
      });
      if (!response.ok) {
        throw new Error(`❌HTTP error! status: ${response.status}`);
    }
      

        if (response.ok) console.log('Comunicação com a API bem sucedida!', response.status);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          //criação de uma string base64 a partir do buffer
          const base64String = Buffer.from(arrayBuffer).toString('base64');

          // guardar o áudio no armazenamento local
          const fileUri = FileSystem.documentDirectory + 'output.mp3';
          await FileSystem.writeAsStringAsync(fileUri, base64String, {
            encoding: FileSystem.EncodingType.Base64,});
            console.log('Áudio guardado em:', fileUri);
          
            const { sound } = await Audio.Sound.createAsync(
              { uri: fileUri },
              { shouldPlay: true }
            );
            setIsPlaying(true); // Start indicator
            console.log('Reproduzindo áudio...');
            // Set a callback when playback finishes
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) {
                setIsPlaying(false); // Stop indicator
                console.log('Áudio reproduzido...');
                
              }
            });
            await sound.playAsync();
            
      
      } catch (error) {
        console.error('Error during fetch:', error);
        console.error('Erro durante a comunicação com a API:', error.JSON.stringify(error));
        Alert.alert('Erro', 'Erro durante a comunicação com a API!');
        }
        setModalVisible(false);
        break;

        /////////////////////////////// STT (Speech to Text) ////////////////////////////////////////

      case 'STT':
        Alert.alert('A comunicar STT');
        console.log('Comunicar STT');

         
        const STTendPoint = apiConfigurations.speech_to_text.endpoint; // Get the TTS endpoint from the JSON file
        const host = apiConfigurations.speech_to_text.host; // Get the host from the JSON file
        console.log('STT Endpoint:', STTendPoint);
        console.log('url: http://'+parsedData.hostnameAPI_TTS+':' + parsedData.portAPI+ STTendPoint);
        try {

           // carregar o ficheiro de áudio a partir dos assets 
           const asset = Asset.fromModule(require('../../assets/Speech_to_text_sample.wav'));
           await asset.downloadAsync(); // esperar o download
           const fileUri = asset.localUri;
           if (!fileUri) {
             throw new Error('❌ Ficheiro de áudio não encontrado!');
            }
 
           // Read file into base64 string
          // const base64String = await FileSystem.readAsStringAsync(fileUri, {encoding: FileSystem.EncodingType.Base64,});
 
          // Convert base64 to blob (required for FormData)
          //const audioBlob = await (await fetch(`data:audio/mpeg;base64,${base64String}`)).blob();
          
          // abordagem com o form data ,deposi trocar o language e model_size pelas selécionadas pelo utilizador
        
          const formData = new FormData();
          formData.append('language', 'en');
          formData.append('model_size', 'base.en');
          formData.append('file', {uri: fileUri,name: 'Speech_to_text_sample.wav',type: 'audio/wav',});


          const response = await fetch(`http://${parsedData.hostnameAPI_TTS}:${parsedData.portAPI}${STTendPoint}`, {
            method: 'POST',
            
            body: formData,
            });
        
            const result = await response.json();

            if (!response.ok) {
              throw new Error(`Erro da API, resposta NOK: ${result.message || response.status}`);
            }
        
            console.log('📝 Resposta da STT:', result);
        
            const transcript = result?.segments?.map(seg => seg.text.trim()).join(' ') || 'Sem conteúdo detectado.';
            
            Alert.alert('Texto reconhecido', transcript);
        
          } catch (error) {
            
            console.error('❌ Erro ao processar STT:', JSON.stringify(error));
            Alert.alert('Erro', 'Erro ao enviar o áudio para transcrição.');
          }

        break;
       /////////////////////////////// LD (Language detector) ////////////////////////////////////////
      case 'LD':
       console.log('Opção: LD');
        const LDendPoint = apiConfigurations.laguage_detector.endpoint; // Get the TTS endpoint from the JSON file

        console.log('Comunicar LD:'+ LDendPoint);
        
        console.log('LD Endpoint:', LDendPoint);
        console.log('url: http://' +parsedData.hostnameAPI_TTS+':' + parsedData.portAPI+ LDendPoint);

        try {
        const response = await fetch(`http://${parsedData.hostnameAPI_TTS}:${parsedData.portAPI}${LDendPoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              text: userInput
          }),
      });
      if (!response.ok) {
        throw new Error(`❌HTTP error! status: ${response.status}`);
    }
      

        if (response.ok){ console.log('Comunicação com a API bem sucedida!', response.status);
        const result = await response.json();
        const languageName = apiConfigurations.languageMap[result.language] || result.language; // Map the language code to a human-readable format
        Alert.alert('Resposta da API:', languageName);
        } else {
          console.error('❌ Erro na comunicação com a API:', response.status);
          Alert.alert('Erro', 'Erro na comunicação com a API!');
        }
        } catch (error) {
        console.error('Error during fetch:', error);
        console.error('Erro durante a comunicação com a API:', error.JSON.stringify(error));
        }
        setModalVisible(false);
        break;
      
      /////////////////////////////// SA (Sentiment Analysis) ////////////////////////////////////////
      case 'SA':
        console.log('Opção: SA');
        const SAendPoint = apiConfigurations.sentiment_analysis.endpoint; // Get the TTS endpoint from the JSON file
        console.log('Comunicar SA:'+ SAendPoint);
        console.log('SA Endpoint:', SAendPoint);
        console.log('url: http://' +parsedData.hostnameAPI_TTS+':' + parsedData.portAPI+ '/' + SAendPoint);
        try {
          sendSentimentAnalysis(userInput)
          .then((response) => {
            console.log('Resposta da API de Análise de Sentimento:', response);
          })
          .catch((error) => {
            console.error('Erro na Análise de Sentimento:', error);
          });
        } catch (error) {
          console.error('Erro ao chamar a função de Análise de Sentimento:', error);
        }
        break;
      case 'Hardware':
        console.log('Opção: Hardware');
        const path = parsedData.hostnameAPI_TTS+':' + parsedData.portAPI;
        const hardwareData = await hardware(path);
        const hardwareLoadData = await hardwareLoad(path);
        
        if (hardwareData && hardwareLoadData) {
          Alert.alert(
            'Dados de Hardware',
            JSON.stringify({ hardwareData, hardwareLoadData }, null, 2)
          );
        }
        break;

      default:
        setModalVisible(false); // Close the modal if no valid option is selected
        console.log('Opção inválida');
    }

  };

  useEffect(() => {
    // Initialize configuration values when the component mounts
    console.log('Inicializando valores de configuração...');
    initializeConfigValues();
  }, []);

  return (
    <ImageBackground source={require('../../assets/images/cropped-isep.jpg')} style={styles.image}>
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>

          <View style={styles.optionsGrid}>
            {debugMode && (
            <View  name ="debugMenu">
            
            <Button
              title="Comunicar text to speech"
              onPress={() => { setModalVisible(true); setCommunicationOption("TTS"); }} // Show the modal
            />
             <Button
              title="Sentiment Analysis"
              onPress={() => {
                setModalVisible(true); setCommunicationOption("SA");
                handleAPICalls('SA');

              }}
            />
            <Button
              title="Speech to text"
              onPress={() => {
                
                handleAPICalls('STT');
                
              }}
            />
            <Button
              title="Show Hardware"
              onPress={() => { setCommunicationOption("Hardware");
                   handleAPICalls('Hardware');
               }}
           
            />
            <Button
              title="Deteção de linguagém"
              onPress={() => {
                setModalVisible(true); setCommunicationOption("LD"); 
                
              }}/>

            </View>)}

           <Button
              title="Falar com o Assistente (Texto)"
              icon ={{ name: 'comment-dots', type: 'font-awesome' }}
              onPress={() => {
                setModalVisible(true);
                setCommunicationOption("text");
                setUserInput(''); // Clear the input field
              }}
            />
            <Button
              title="Falar com o Assistente (Voz)"
              onPress={() => {
                handleAPICalls('STT'); // Aqui vamos adaptar depois para enviar o texto reconhecido para o chat
              }}
            />
          </View>
          {isChatVisible &&  (<ChatComponent/>)}

        </View>

        {/* Modal for user input */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setModalVisible(false)} // Close modal on back button press
        >
          {isPlaying && (
              <View style={styles.overlay}>
              <View style={styles.overlayContent}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.overlayText}>🔊 Reproduzindo áudio...</Text>
              </View>
            </View>
          )}
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Digite algo:</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite algo..."
                placeholderTextColor="grey"
                value={userInput}
                onChangeText={setUserInput} // Update state with user input
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleAPICalls(communicationOption) } // Call the function with the selected option
                >
                  <Text style={styles.buttonText}>Enviar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)} // Close the modal
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    margin: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  image: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
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
    zIndex: 9999, // ensure it's on top, manter em mente que o zIndex é relativo ao componente pai
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