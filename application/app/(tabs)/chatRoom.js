import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import MessageList from '../../components/MessageList';

const CHAT_STORAGE_KEY = '@chat_messages';

export default function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);

  // CARREGAMENTO INICIAL - useEffect para persistência
  useEffect(() => {
    loadMessages();
    setupAudioMode();
  }, []);

  // CONFIGURAÇÃO DE ÁUDIO - Configurar modo de gravação
  const setupAudioMode = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Erro ao configurar áudio:', error);
    }
  };

  // FUNÇÃO DE CARREGAMENTO - Lê dados do AsyncStorage
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const storedMessages = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      
      if (storedMessages) {
        // Parse dos dados JSON e conversão de timestamps
        const parsedMessages = JSON.parse(storedMessages).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp) // Reconstroi objeto Date
        }));
        setMessages(parsedMessages);
      } else {
        // Mensagens iniciais se não houver dados salvos
        const initialMessages = [
          { id: 1, text: "Olá! Como posso ajudá-lo hoje?", sender: "ai", timestamp: new Date() },
        ];
        setMessages(initialMessages);
        await saveMessages(initialMessages);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      Alert.alert('Erro', 'Falha ao carregar conversas anteriores');
    } finally {
      setIsLoading(false);
    }
  };

  // FUNÇÃO DE SALVAMENTO - Persiste dados no AsyncStorage
  const saveMessages = async (messagesToSave) => {
    try {
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Erro ao salvar mensagens:', error);
      Alert.alert('Erro', 'Falha ao salvar a conversa');
    }
  };

  // FUNÇÃO ATUALIZADA - Agora salva após cada mensagem
  const sendMessage = async () => {
    if (inputText.trim()) { // Verifica se o texto não está vazio
      const newMessage = {
        id: Date.now(), // Usando timestamp como ID único
        text: inputText.trim(),
        sender: "user",
        timestamp: new Date()
      };
      
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setInputText('');
      
      // PERSISTÊNCIA IMEDIATA - Salva após adicionar mensagem do usuário
      await saveMessages(updatedMessages);
      
      // INDICADOR DE QUE A IA ESTÁ PROCESSANDO
      setIsAiTyping(true);
      
      console.log('📝 Enviando mensagem...');
      console.log('🔊 Modo de voz:', isVoiceModeEnabled ? 'ATIVO' : 'INATIVO');
      
      // Simular resposta da IA após um delay
      setTimeout(async () => {
        const aiResponse = {
          id: Date.now() + 1, // ID único para resposta da IA
          text: "Obrigado pela sua mensagem! Como posso ajudá-lo?",
          sender: "ai",
          timestamp: new Date()
        };
        const finalMessages = [...updatedMessages, aiResponse];
        setMessages(finalMessages);
        
        // PERSISTÊNCIA DA RESPOSTA IA - Salva resposta da IA também
        await saveMessages(finalMessages);
        
        // AQUI SERÁ INTEGRADO O TTS SE O MODO VOZ ESTIVER ATIVO
        if (isVoiceModeEnabled) {
          console.log('🔊 Modo de voz ativo - TTS será executado aqui');
          // TODO: Integrar função handleTTS do utils.js
        }
        
        // REMOVER INDICADOR DE PROCESSAMENTO
        setIsAiTyping(false);
      }, 2000); // Aumentei para 2 segundos para simular processamento mais realista
    }
  };

  // FUNÇÃO UTILITÁRIA - Limpar conversa (opcional)
  const clearChat = async () => {
    Alert.alert(
      'Limpar Conversa',
      'Tem certeza que deseja apagar toda a conversa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
              setMessages([]);
              setIsAiTyping(false); // Reset do estado de typing também
              Alert.alert('Sucesso', 'Conversa limpa com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao limpar a conversa');
            }
          }
        }
      ]
    );
  };

  // FUNÇÃO PARA TOGGLE DE VOZ - Gerencia modo TTS/STT
  const toggleVoiceMode = () => {
    const newMode = !isVoiceModeEnabled;
    setIsVoiceModeEnabled(newMode);
    
    // Feedback para o usuário
    Alert.alert(
      'Modo de Voz',
      newMode 
        ? 'Modo de voz ativado! As respostas da IA serão reproduzidas em áudio.' 
        : 'Modo de voz desativado. Voltando ao modo texto.',
      [{ text: 'OK' }]
    );
    
    console.log('🔊 Modo de voz:', newMode ? 'ATIVADO' : 'DESATIVADO');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chat com IA</Text>
          <View style={styles.voiceModeContainer}>
            <MaterialIcons 
              name={isVoiceModeEnabled ? "volume-up" : "volume-off"} 
              size={16} 
              color="white" 
              style={styles.voiceIcon}
            />
            <Switch
              value={isVoiceModeEnabled}
              onValueChange={toggleVoiceMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isVoiceModeEnabled ? '#f5dd4b' : '#f4f3f4'}
              style={styles.voiceSwitch}
            />
          </View>
        </View>
        
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <MaterialIcons name="delete" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.messagesContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Carregando conversa...</Text>
          </View>
        ) : (
          <>
            <MessageList messages={messages} />
            {isAiTyping && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.typingText}>IA está digitando...</Text>
              </View>
            )}
          </>
        )}
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Digite sua mensagem..."
          multiline
        />
        <TouchableOpacity 
          onPress={sendMessage} 
          style={[styles.sendButton, isAiTyping && styles.sendButtonDisabled]}
          disabled={isAiTyping}
        >
          {isAiTyping ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialIcons name="send" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  clearButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  voiceModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  voiceIcon: {
    marginRight: 4,
  },
  voiceSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    marginVertical: 5,
    alignSelf: 'flex-start',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  }
})