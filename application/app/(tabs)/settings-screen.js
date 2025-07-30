import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage' //https://react-native-async-storage.github.io/async-storage/docs/usage/


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

const toggleSwitch = async (value) => {
  
   setDebugMode(value);
  console.log('Debug mode toggled:', debugMode);
  try {
    await AsyncStorage.setItem('debugMode', JSON.stringify(debugMode));
  } catch (error) {
    console.error("❌ Erro ao guardar estado de debug!", error);
  }
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
      console.log('📦 Dados carregados com sucesso!');
      console.log('Nome: ' + parsedData.name);
      console.log('Email: ' + parsedData.email);
      console.log('Hostname API: ' + parsedData.hostnameAPI_TTS);
      console.log('Porta API: ' + parsedData.portAPI);
      console.log('Hostname MQTT: ' + parsedData.hostnameMQTT);

    }
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
    };

    await AsyncStorage.setItem('userSettings', JSON.stringify(userData));
    Alert.alert('Sucesso', 'Configurações salvas!');
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
        console.log('💾 Configurações do user salvas!');
    }
    catch (error) {
        console.error("❌ Erro ao guardar dados do user!",error);
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
        console.log('💾Configurações de conexão salvas!');
        console.log('Hostname API:' + hostnameAPI_TTS);
        console.log('Port API:' + portAPI);
        console.log('Hostname MQTT:' + hostnameMQTT);
        console.log('Port MQTT:' + portMQTT);
        console.log('Auth Name:' + authName);
    }
    catch (error) {
        console.error("❌ Erro ao guardar dados de conexão!",error);
    }
  };

 // guardar dados de autenticação

  const saveAuthData = async () => {
    try {  
        setAuthName(authName);
        setAuthPassword(authPassword);
        saveSettings();
        console.log('💾 Dados de autenticação salvos!');
    }
    catch (error) {
        console.error("❌ Erro ao guardar dados de autenticação!",error);
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
      console.log('💾 configurações de perfil salvas!');
    } catch (error) {
      console.error("❌ Erro ao guardar onfigurações de perfil!", error);
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
        <SafeAreaView>
          <View style={styles.container}>
            <Text style={{fontSize: 20}}>Configurações do usuário</Text>

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
            <Button title="Salvar Conf. do usuário" onPress={ saveUserSettings} />
            </View>
             
          </View>
          
          <View style={styles.container}>
            <Text style={{fontSize: 20}} >Configurações da aplicação</Text>
              <View>

                <Text>Endpoint das APIs de TTS, STT</Text>
                <View style={styles.inputField}>
                  <TextInput placeholder="Hostname" placeholderTextColor={'grey'} value={hostnameAPI_TTS} onChangeText={setHostnameAPI_TTS}/>
                </View>
                <View style={styles.inputField}>
                  <TextInput placeholder="Porta" placeholderTextColor={'grey'} value={portAPI} onChangeText={setPortAPI}/>
                </View>


                <Text>Endpoint MQTT</Text>
                <View style={styles.inputField}>
                  <TextInput placeholder="Hostname" placeholderTextColor={'grey'} value={hostnameMQTT} onChangeText={setHostnameMQTT}/>
                </View>

                <View style={styles.inputField}>
                  <TextInput placeholder="Porta" placeholderTextColor={'grey'} value={portMQTT} onChangeText={setPortMQTT}/>
                </View>
                <View style={styles.buttonSpace}> 
                  <Button title="Salvar Conf. da conexão" onPress={ saveConnectionSettings} />
                </View>
              </View>
          </View>
              <View style={styles.container}>             
                <Text>Dados de autenticação</Text>
                <View style={styles.inputField}>
                  <TextInput placeholder="username" placeholderTextColor={'grey'} value={authName} onChangeText={setAuthName}/>
                </View>
                <View style={styles.inputField}>
                  <TextInput placeholder="password" placeholderTextColor={'grey'} value={authPassword} onChangeText={setAuthPassword}/>
                </View>
                <View style={styles.buttonSpace}> 
                  <Button title="Salvar dados de autenticação" onPress={ async () => saveAuthData()} />
                </View>

              </View>
              <View style={styles.container}>
                <Text style={{fontSize: 20}}>Debug Mode</Text>
                <Text>Ativar/desativar o modo de depuração</Text>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    margin: 10, 
    borderRadius: 10,
  },
  image:
  {
    alignContent:'center',width: 100, height: 100, borderRadius: 50, marginBottom: 10
  },
  inputField: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  buttonSpace: {
    padding: 10,
  }
});
