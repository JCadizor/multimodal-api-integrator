import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import api_configurations from '../../constants/api_configurations.json';


export default function SettingsScreen() {

const navigation = useNavigation();

const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [pin, setPin] = useState('');
const [password, setPassword] = useState('');
const [hostnameAPI_TTS, setHostnameAPI_TTS] = useState('');
const [portAPI, setPortAPI] = useState('');
const [hostnameMQTT, setHostnameMQTT] = useState('');
const [portMQTT, setPortMQTT] = useState('');
const [authName, setAuthName] = useState('');
const [authPassword, setAuthPassword] = useState('');
const [profileImage, setProfileImage] = useState(null);
const [debugMode, setDebugMode] = useState(false); // State to control debug mode visibility
const [selectedVoice, setSelectedVoice] = useState('en-US-JennyNeural'); // Default voice
const [selectedSTTModel, setSelectedSTTModel] = useState('base'); // Default STT model
const [defaultLanguage, setDefaultLanguage] = useState('pt'); // Default language

const toggleSwitch = async (value) => {
  
   setDebugMode(value);
  console.log('Debug mode toggled:', debugMode);
  try {
    await AsyncStorage.setItem('debugMode', JSON.stringify(debugMode));
  } catch (error) {
    console.error("❌ Erro ao guardar estado de debug!", error);
  }
};

// FUNÇÃO PARA GERAR OPÇÕES DE VOZ
const generateVoiceOptions = () => {
  const voiceOptions = [];
  const voiceConfig = api_configurations.Routes.voice;
  
  // English Adults
  if (voiceConfig.english_adutls) {
    Object.keys(voiceConfig.english_adutls).forEach(country => {
      Object.keys(voiceConfig.english_adutls[country]).forEach(name => {
        const voiceId = voiceConfig.english_adutls[country][name];
        voiceOptions.push({
          label: `English (${country}) - ${name}`,
          value: voiceId,
          category: 'English Adults'
        });
      });
    });
  }
  
  // English Children
  if (voiceConfig.english_children) {
    Object.keys(voiceConfig.english_children).forEach(country => {
      Object.keys(voiceConfig.english_children[country]).forEach(name => {
        const voiceId = voiceConfig.english_children[country][name];
        voiceOptions.push({
          label: `English Children (${country}) - ${name}`,
          value: voiceId,
          category: 'English Children'
        });
      });
    });
  }
  
  // Portuguese Adults
  if (voiceConfig.portuguese_adutls) {
    Object.keys(voiceConfig.portuguese_adutls).forEach(country => {
      Object.keys(voiceConfig.portuguese_adutls[country]).forEach(name => {
        const voiceId = voiceConfig.portuguese_adutls[country][name];
        voiceOptions.push({
          label: `Portuguese (${country}) - ${name}`,
          value: voiceId,
          category: 'Portuguese Adults'
        });
      });
    });
  }
  
  return voiceOptions;
};

// FUNÇÃO PARA GERAR OPÇÕES DE MODELO STT
const generateSTTModelOptions = () => {
  const modelOptions = [];
  const modelConfig = api_configurations.Routes.speech_to_text.models;
  
  Object.keys(modelConfig).forEach(modelKey => {
    const model = modelConfig[modelKey];
    modelOptions.push({
      label: `${model.name} - ${model.description}`,
      value: modelKey
    });
  });
  
  return modelOptions;
};

// FUNÇÃO PARA GERAR OPÇÕES DE IDIOMA PADRÃO
const generateLanguageOptions = () => {
  const languageOptions = [];
  const languageMap = api_configurations.Routes.languageMap;
  
  // Adicionar idiomas mais comuns primeiro
  const commonLanguages = ['pt', 'en', 'es', 'fr'];
  
  commonLanguages.forEach(langCode => {
    if (languageMap[langCode]) {
      languageOptions.push({
        label: `${languageMap[langCode]} (${langCode})`,
        value: langCode
      });
    }
  });
  
  // Adicionar outros idiomas restantes
  Object.keys(languageMap).forEach(langCode => {
    if (!commonLanguages.includes(langCode)) {
      languageOptions.push({
        label: `${languageMap[langCode]} (${langCode})`,
        value: langCode
      });
    }
  });
  
  return languageOptions;
};



const  initializeConfigValues = async ()=> {

  try {
    const savedData = await AsyncStorage.getItem('userSettings');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setName(parsedData.name || '');
      setEmail(parsedData.email || '');
      setPin(parseInt(parsedData.pin || ''));
      setPassword(parsedData.password || '');
      
      setHostnameAPI_TTS(parsedData.hostnameAPI_TTS || '');
      setPortAPI(parsedData.portAPI || '');

      setHostnameMQTT(parsedData.hostnameMQTT || '');
      setPortMQTT(parsedData.portMQTT || '');
      
      setAuthName(parsedData.authName || '');
      setAuthPassword(parsedData.authPassword || '');

      setProfileImage(parsedData.profileImage || null);
      setSelectedVoice(parsedData.selectedVoice || 'en-US-JennyNeural'); // Load selected voice
      setSelectedSTTModel(parsedData.selectedSTTModel || 'base'); // Load selected STT model
      setDefaultLanguage(parsedData.defaultLanguage || 'pt'); // Load default language
      
    console.log('Dados carregados com sucesso!');
    console.log('Nome: ' + parsedData.name);
    console.log('Email: ' + parsedData.email);
    console.log('Hostname API: ' + parsedData.hostnameAPI_TTS);
    console.log('Porta API: ' + parsedData.portAPI);
    console.log('Hostname MQTT: ' + parsedData.hostnameMQTT);    }
  } catch (error) {
    console.error("❌ Erro ao carregar os dados!", error);
  }
}

// Salvar as configurações no armazenamento local
const saveSettings = async () => {
  try {
    const userData = {
      name,
      email,
      pin,
      password,
      hostnameAPI_TTS,
      portAPI,
      hostnameMQTT,
      portMQTT,
      authName,
      authPassword,
      profileImage,
      selectedVoice, // Save selected voice
      selectedSTTModel, // Save selected STT model
      defaultLanguage, // Save default language
    };

    await AsyncStorage.setItem('userSettings', JSON.stringify(userData));
    Alert.alert('Sucesso', 'Configurações salvas!');
    console.log('Voz selecionada salva:', selectedVoice);
    console.log('Modelo STT selecionado salvo:', selectedSTTModel);
    console.log('Idioma padrão salvo:', defaultLanguage);
  } catch (error) {
    console.error("❌ Erro ao guardar os dados!", error);
  }
};
// guardar definições do utilizador
  const saveUserSettings = async () => {
    try {
        setName(name);
        setEmail(email);        
        setPin(parseInt(pin));
        setPassword(password);
        setProfileImage(profileImage);
        saveSettings();
        console.log('Configurações do usuário salvas!');
    }
    catch (error) {
        console.error("Erro ao salvar dados do usuário!",error);
    }
  };

  // guardar definições de conexão

  const saveConnectionSettings = async () => {
   try {
        setHostnameAPI_TTS(hostnameAPI_TTS);
        setPortAPI(portAPI);
        setHostnameMQTT(hostnameMQTT);
        setPortMQTT(portMQTT);
        saveSettings();
        console.log('Configurações de conexão salvas!');
        console.log('Hostname API:' + hostnameAPI_TTS);
        console.log('Port API:' + portAPI);
        console.log('Hostname MQTT:' + hostnameMQTT);
        console.log('Port MQTT:' + portMQTT);
        console.log('Auth Name:' + authName);
    }
    catch (error) {
        console.error("Erro ao salvar dados de conexão!",error);
    }
  };

 // guardar dados de autenticação

  const saveAuthData = async () => {
    try {  
        setAuthName(authName);
        setAuthPassword(authPassword);
        saveSettings();
        console.log('Dados de autenticação salvos!');
    }
    catch (error) {
        console.error("Erro ao salvar dados de autenticação!",error);
    }   
  };

  // Função para selecionar uma imagem da galeria
const pickImage = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled) {
    setProfileImage(result.assets[0].uri);
    // Salvar a imagem no armazenamento local (opcional)
    try {
      saveSettings();
      console.log('Configurações de perfil salvas!');
    } catch (error) {
      console.error("Erro ao salvar configurações de perfil!", error);
    }
  }
};

  useEffect(() => {
     (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
       Alert.alert('É necessario a sua permissão para aceder à galeria de imagens');
      }
    })();
    initializeConfigValues();
  }, []);
  
  return (
    
    <ScrollView >
      <SafeAreaProvider>
        <SafeAreaView >
          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Configurações do Usuário</Text>

              {/* Seção da Imagem de Perfil */}
              <TouchableOpacity onPress={pickImage}>
            <Image 
              source={profileImage ? { uri: profileImage } : require('../../assets/images/default-profile.png')} style={styles.image}/>
          </TouchableOpacity>
          
            <View style={styles.inputField}>
              <TextInput placeholder="Nome" placeholderTextColor={'grey'} value={name} onChangeText={setName}/>
            </View>
            
            <View style={styles.inputField}>
              <TextInput placeholder="Email" placeholderTextColor={'grey'} value={email} onChangeText={setEmail} keyboardType="email-address" />
            </View>
              
            <View style={styles.inputField}>
              <TextInput placeholder="PIN" placeholderTextColor={'grey'} value={pin} onChangeText={setPin} keyboardType="numeric" secureTextEntry />
            </View>
              
            <View style={styles.inputField}>
              <TextInput placeholder="Senha" placeholderTextColor={'grey'} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
            <View style={styles.buttonSpace}> 
            <TouchableOpacity style={styles.customButton} onPress={saveUserSettings}>
              <Text style={styles.customButtonText}>Salvar Configurações</Text>
            </TouchableOpacity>
            </View>
             
          </View>
          
          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Configurações da Aplicação</Text>
              <View>

                <Text style={styles.sectionDescription}>Endpoint das APIs de TTS, STT</Text>
                <View style={styles.inputField}>
                  <TextInput placeholder="Hostname" placeholderTextColor={'grey'} value={hostnameAPI_TTS} onChangeText={setHostnameAPI_TTS}/>
                </View>
                <View style={styles.inputField}>
                  <TextInput placeholder="Porta" placeholderTextColor={'grey'} value={portAPI} onChangeText={setPortAPI}/>
                </View>


                <Text style={styles.sectionDescription}>Endpoint MQTT</Text>
                <View style={styles.inputField}>
                  <TextInput placeholder="Hostname" placeholderTextColor={'grey'} value={hostnameMQTT} onChangeText={setHostnameMQTT}/>
                </View>

                <View style={styles.inputField}>
                  <TextInput placeholder="Porta" placeholderTextColor={'grey'} value={portMQTT} onChangeText={setPortMQTT}/>
                </View>
                <View style={styles.buttonSpace}> 
                  <TouchableOpacity style={styles.customButton} onPress={saveConnectionSettings}>
                    <Text style={styles.customButtonText}>Salvar Configurações de Conexão</Text>
                  </TouchableOpacity>
                </View>
              </View>
          </View>
              <View style={styles.container}>             
                <Text style={styles.sectionDescription}>Dados de autenticação</Text>
                <View style={styles.inputField}>
                  <TextInput placeholder="username" placeholderTextColor={'grey'} value={authName} onChangeText={setAuthName}/>
                </View>
                <View style={styles.inputField}>
                  <TextInput placeholder="password" placeholderTextColor={'grey'} value={authPassword} onChangeText={setAuthPassword}/>
                </View>
                <View style={styles.buttonSpace}> 
                  <TouchableOpacity style={styles.customButton} onPress={async () => saveAuthData()}>
                    <Text style={styles.customButtonText}>Salvar Dados de Autenticação</Text>
                  </TouchableOpacity>
                </View>

              </View>
              
              <View style={styles.container}>
                <Text style={styles.sectionTitle}>Configurações de Voz</Text>
                <Text style={styles.sectionDescription}>Selecione a voz para Text-to-Speech</Text>
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Voz:</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={selectedVoice}
                      onValueChange={(itemValue) => setSelectedVoice(itemValue)}
                      style={styles.picker}
                    >
                      {generateVoiceOptions().map((option, index) => (
                        <Picker.Item 
                          key={index}
                          label={option.label} 
                          value={option.value} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.selectedVoiceInfo}>
                  <Text style={styles.selectedVoiceText}>
                    Voz Atual: {selectedVoice}
                  </Text>
                </View>
              </View>
              
              <View style={styles.container}>
                <Text style={styles.sectionTitle}>Configurações de STT</Text>
                <Text style={styles.sectionDescription}>Selecione o modelo para Speech-to-Text</Text>
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Modelo STT:</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={selectedSTTModel}
                      onValueChange={(itemValue) => setSelectedSTTModel(itemValue)}
                      style={styles.picker}
                    >
                      {generateSTTModelOptions().map((option, index) => (
                        <Picker.Item 
                          key={index}
                          label={option.label} 
                          value={option.value} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.selectedVoiceInfo}>
                  <Text style={styles.selectedVoiceText}>
                    Modelo STT Atual: {selectedSTTModel}
                  </Text>
                </View>
              </View>
              
              <View style={styles.container}>
                <Text style={styles.sectionTitle}>Idioma Padrão</Text>
                <Text style={styles.sectionDescription}>Idioma padrão para transcrição quando a detecção automática falhar</Text>
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Idioma Padrão:</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={defaultLanguage}
                      onValueChange={(itemValue) => setDefaultLanguage(itemValue)}
                      style={styles.picker}
                    >
                      {generateLanguageOptions().map((option, index) => (
                        <Picker.Item 
                          key={index}
                          label={option.label} 
                          value={option.value} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.selectedVoiceInfo}>
                  <Text style={styles.selectedVoiceText}>
                    Idioma Atual: {defaultLanguage}
                  </Text>
                </View>
              </View>
              
              <View style={styles.container}>
                <Text style={styles.sectionTitle}>Modo Debug</Text>
                <Text style={styles.sectionDescription}>Ativar/desativar o modo de depuração</Text>
                    <Switch
                      scaleX = {1.5}
                      scaleY = {1.5}
                      Text ="Debug Mode"
                      TextColor = "white"
                      value={debugMode}
                      trackColor={{ false: "#ff0000", true: "#00ff00" }}
                      onValueChange={(value) => {
                        toggleSwitch(value);
                        
                      }}
                      
                    />
              </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </ScrollView>
    
  );
}


const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    margin: 10, 
    borderRadius: 10,
    minHeight: 'auto',
    flexShrink: 1,
    // Garantir que todos os cantos sejam consistentemente arredondados
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
    width: '100%',
    flexWrap: 'wrap',
  },
  sectionDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
    width: '100%',
    maxWidth: 300,
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  image: {
    alignContent: 'center',
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginBottom: 10,
    // Garantir que a imagem mantenha o formato circular
    overflow: 'hidden',
  },
  inputField: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    width: '100%',
    maxWidth: 300,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginVertical: 5,
  },
  buttonSpace: {
    padding: 10,
    width: '100%',
    maxWidth: 300,
    borderRadius: 10,
    marginVertical: 5,
  },
  pickerContainer: {
    width: '100%',
    maxWidth: 300,
    marginVertical: 15,
    borderRadius: 10,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'left',
    flexWrap: 'wrap',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    width: '100%',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  selectedVoiceInfo: {
    backgroundColor: '#e6f3ff',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    maxWidth: 300,
  },
  selectedVoiceText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  customButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 5,
  },
  customButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
