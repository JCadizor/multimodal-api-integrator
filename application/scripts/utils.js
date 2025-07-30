// obter a data do AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

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