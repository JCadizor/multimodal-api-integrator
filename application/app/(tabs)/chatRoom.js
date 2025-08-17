import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, Switch, ImageBackground } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import MessageList from '../../components/MessageList';
import { 
  handleTTS, 
  handleSTT, 
  handleSTTWithLanguage,
  handleLanguageDetection, 
  retrieveAsyncStorageDataAsJson 
} from '../../scripts/utils';
import { startTextToTextStream } from '../../scripts/handleComunication';

const CHAT_STORAGE_KEY = '@chat_messages';

export default function ChatRoom() {
  // PARÂMETROS DE NAVEGAÇÃO
  const params = useLocalSearchParams();
  const initialMode = params.initialMode || 'text'; // 'text' ou 'voice'
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  // Modo de voz baseado no parâmetro de navegação: 'voice' = true, 'text' = false
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(initialMode === 'voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [configData, setConfigData] = useState({});
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);

  // CARREGAMENTO INICIAL - useEffect para persistência
  useEffect(() => {
    console.log('Modo inicial do chat:', initialMode);
    
    // Configurar modo de voz baseado no parâmetro de navegação
    if (initialMode === 'voice') {
      console.log('🎤 Chat iniciado em modo VOZ - gravação ativada automaticamente');
      setIsVoiceModeEnabled(true);
    } else {
      console.log('📝 Chat iniciado em modo TEXTO - input de texto ativado');
      setIsVoiceModeEnabled(false);
    }
    
    initializeChat();
  }, []);

  // FUNÇÃO DE INICIALIZAÇÃO DO CHAT
  const initializeChat = async () => {
    await loadMessages();
    await loadConfig();
    await setupAudio();
  };

  // CARREGAMENTO DE CONFIGURAÇÕES - Carrega dados do AsyncStorage
  const loadConfig = async () => {
    try {
      const data = await retrieveAsyncStorageDataAsJson();
      if (data) {
        setConfigData(data);
        console.log('Configurações carregadas:', data);
      } else {
        console.log('Nenhuma configuração encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // CONFIGURAÇÃO DE ÁUDIO - Configurar modo de gravação
  const setupAudio = async () => {
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
      
      // Processar resposta da IA
      await processAIResponse(updatedMessages);
    }
  };

  // FUNÇÃO PARA PROCESSAR RESPOSTA DA IA
  const processAIResponse = async (currentMessages) => {
    // INDICADOR DE QUE A IA ESTÁ PROCESSANDO
    setIsAiTyping(true);
    
    console.log('📝 Processando resposta da IA...');
    console.log('🔊 Modo de voz:', isVoiceModeEnabled ? 'ATIVO' : 'INATIVO');
    
    try {
      // Preparar mensagens para a API (formato esperado pela API)
      const lastUserMessage = currentMessages[currentMessages.length - 1];
      const prompt = lastUserMessage.text;
      
      // Converter histórico de mensagens para formato da API
      const apiMessages = currentMessages
        .filter(msg => msg.sender !== 'ai' || msg.text !== "Olá! Como posso ajudá-lo hoje?") // Filtrar mensagem inicial
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      console.log('📡 Enviando para API:', { prompt, messages: apiMessages });

      // Criar mensagem inicial da IA (vazia, será preenchida com streaming)
      const aiResponse = {
        id: Date.now() + 1,
        text: "",
        sender: "ai",
        timestamp: new Date(),
        isStreaming: true
      };
      
      let tempMessages = [...currentMessages, aiResponse];
      setMessages(tempMessages);
      await saveMessages(tempMessages);

      // Função para processar dados recebidos do stream
      const onData = (content) => {
        aiResponse.text += content;
        tempMessages = [...currentMessages, { ...aiResponse }];
        setMessages(tempMessages);
      };

      // Função chamada quando o stream termina
      const onDone = async () => {
        console.log('✅ Stream finalizado. Resposta completa:', aiResponse.text);
        
        // Marcar como não-streaming e salvar mensagem final
        aiResponse.isStreaming = false;
        const finalMessages = [...currentMessages, aiResponse];
        setMessages(finalMessages);
        await saveMessages(finalMessages);

        // INTEGRAÇÃO TTS SE O MODO VOZ ESTIVER ATIVO
        if (isVoiceModeEnabled && aiResponse.text.trim()) {
          console.log('🔊 Modo de voz ativo - Executando TTS...');
          try {
            if (configData.hostnameAPI_TTS && configData.portAPI) {
              await handleTTS(aiResponse.text, configData, setIsTTSPlaying);
            } else {
              console.warn('⚠️ Configurações não disponíveis para TTS');
              Alert.alert('Aviso', 'Configurações de TTS não disponíveis');
            }
          } catch (error) {
            console.error('❌ Erro no TTS:', error);
            Alert.alert('Erro', 'Erro ao reproduzir resposta em áudio');
          }
        }

        // REMOVER INDICADOR DE PROCESSAMENTO
        setIsAiTyping(false);
      };

      // Função para tratar erros
      const onError = (error) => {
        console.error('❌ Erro na API de Text to Text:', error);
        
        // Criar resposta de erro
        const errorResponse = {
          id: Date.now() + 1,
          text: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
          sender: "ai",
          timestamp: new Date(),
          isError: true
        };
        
        const errorMessages = [...currentMessages, errorResponse];
        setMessages(errorMessages);
        saveMessages(errorMessages);
        setIsAiTyping(false);
        
        Alert.alert('Erro', 'Falha ao conectar com a IA. Verifique sua conexão e configurações.');
      };

      // Iniciar stream da API
      await startTextToTextStream({
        prompt,
        messages: apiMessages,
        onData,
        onDone,
        onError
      });

    } catch (error) {
      console.error('❌ Erro geral no processamento da IA:', error);
      
      // Resposta de fallback em caso de erro
      const fallbackResponse = {
        id: Date.now() + 1,
        text: "Desculpe, não foi possível processar sua mensagem no momento.",
        sender: "ai",
        timestamp: new Date()
      };
      
      const fallbackMessages = [...currentMessages, fallbackResponse];
      setMessages(fallbackMessages);
      await saveMessages(fallbackMessages);
      setIsAiTyping(false);
      
      Alert.alert('Erro', 'Erro inesperado. Tente novamente.');
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
              // Parar gravação se estiver ativa
              if (recording) {
                await stopRecording();
              }
              
              await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
              setMessages([]);
              setIsAiTyping(false);
              setIsRecording(false);
              setRecordedAudio(null);
              setIsTTSPlaying(false);
              
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
    
    // Limpar estado de gravação ao trocar modo
    if (!newMode && recording) {
      stopRecording();
    }
    
    // Feedback para o usuário
    Alert.alert(
      'Modo de Voz',
      newMode 
        ? 'Modo de voz ativado! Pressione o botão do microfone para gravar sua mensagem.' 
        : 'Modo de voz desativado. Voltando ao modo texto.',
      [{ text: 'OK' }]
    );
    
    console.log('🔊 Modo de voz:', newMode ? 'ATIVADO' : 'DESATIVADO');
  };

  // FUNÇÃO PARA INICIAR GRAVAÇÃO
  const startRecording = async () => {
    try {
      console.log('🎤 Iniciando gravação...');
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      console.log('🎤 Gravação iniciada!');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação');
    }
  };

  // FUNÇÃO PARA PARAR GRAVAÇÃO
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      console.log('🛑 Parando gravação...');
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setRecording(null);
      setIsRecording(false);
      setRecordedAudio(uri);
      
      console.log('✅ Gravação salva em:', uri);
      
      // Processar áudio gravado
      if (uri) {
        await processRecordedAudio(uri);
      }
      
    } catch (error) {
      console.error('❌ Erro ao parar gravação:', error);
      Alert.alert('Erro', 'Erro ao processar gravação');
    }
  };

  // FUNÇÃO PARA PROCESSAR ÁUDIO GRAVADO
  const processRecordedAudio = async (audioUri) => {
    console.log('🔄 Processando áudio gravado...');
    
    try {
      // Verificar se temos configurações
      if (!configData.hostnameAPI_TTS || !configData.portAPI) {
        console.warn('⚠️ Configurações não carregadas, usando transcrição simulada');
        const simulatedTranscription = "Mensagem de áudio transcrita (simulada)";
        await createMessageFromTranscription(simulatedTranscription, true, null, audioUri);
        return;
      }

      // 1. Primeira transcrição com idioma padrão para detectar idioma
      console.log('🎤 Primeira transcrição para detecção de idioma...');
      const initialTranscription = await handleSTT(audioUri, configData);
      
      // 2. Detectar idioma do texto transcrito
      let detectedLanguage = null;
      let finalTranscription = initialTranscription;
      
      try {
        detectedLanguage = await handleLanguageDetection(initialTranscription, configData);
        console.log('🌍 Idioma detectado:', detectedLanguage.name, `(${detectedLanguage.code})`);
        
        // 3. Se o idioma detectado for diferente do padrão, fazer nova transcrição
        const detectedLangCode = detectedLanguage.code;
        const defaultLang = configData.defaultLanguage || 'pt'; // Usar idioma padrão configurado
        
        if (detectedLangCode !== defaultLang) {
          console.log(`🔄 Re-transcrevendo áudio com idioma detectado: ${detectedLangCode}`);
          finalTranscription = await handleSTTWithLanguage(audioUri, configData, detectedLangCode);
          console.log('✅ Transcrição final:', finalTranscription);
        } else {
          console.log('✅ Idioma detectado coincide com padrão, usando transcrição inicial');
        }
        
      } catch (langError) {
        console.warn('⚠️ Erro na detecção de idioma:', langError);
        console.log('📝 Continuando com transcrição inicial');
        // Continuar com a transcrição inicial
      }
      
      // 4. Criar mensagem com informações finais
      await createMessageFromTranscription(finalTranscription, true, detectedLanguage, audioUri);
      
    } catch (error) {
      console.error('❌ Erro ao processar áudio:', error);
      // Fallback para simulação em caso de erro
      const fallbackTranscription = "Erro na transcrição - mensagem simulada";
      await createMessageFromTranscription(fallbackTranscription, true, null, audioUri);
    }
  };

  // FUNÇÃO AUXILIAR - Criar mensagem a partir da transcrição
  const createMessageFromTranscription = async (transcriptionText, isVoiceMessage = false, detectedLanguage = null, audioUri = null) => {
    const newMessage = {
      id: Date.now(),
      text: transcriptionText,
      sender: "user",
      timestamp: new Date(),
      isVoiceMessage,
      audioUri, // URI do áudio gravado para playback
      detectedLanguage: detectedLanguage ? {
        code: detectedLanguage.code,
        name: detectedLanguage.name
      } : null
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    // Log informativo sobre o idioma detectado
    if (detectedLanguage) {
      console.log(`📝 Mensagem criada em ${detectedLanguage.name} (${detectedLanguage.code}): "${transcriptionText}"`);
    }
    
    // Salvar e processar resposta da IA
    await saveMessages(updatedMessages);
    await processAIResponse(updatedMessages);
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/cropped-isep.jpg')} 
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.5 }}
    >
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chat com IA</Text>
          <View style={styles.voiceModeContainer}>
            <MaterialIcons 
              name={isVoiceModeEnabled ? "record-voice-over" : "voice-over-off"} 
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
            <MessageList messages={messages} configData={configData} />
            {isAiTyping && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.typingText}>IA está digitando...</Text>
              </View>
            )}
            {isTTSPlaying && (
              <View style={styles.ttsIndicator}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.ttsText}>🔊 Reproduzindo resposta...</Text>
              </View>
            )}
          </>
        )}
      </View>
      
      <View style={styles.inputContainer}>
        {isVoiceModeEnabled ? (
          // MODO DE VOZ - Botão de gravação
          <View style={styles.voiceInputContainer}>
            <TouchableOpacity 
              onPress={isRecording ? stopRecording : startRecording}
              style={[
                styles.recordButton, 
                isRecording && styles.recordButtonActive,
                isAiTyping && styles.recordButtonDisabled
              ]}
              disabled={isAiTyping}
            >
              {isRecording ? (
                <MaterialIcons name="stop" size={32} color="white" />
              ) : (
                <MaterialIcons name="mic" size={32} color="white" />
              )}
            </TouchableOpacity>
            <Text style={styles.recordingStatus}>
              {isRecording ? 'Gravando... Toque para parar' : 'Toque para gravar'}
            </Text>
          </View>
        ) : (
          // MODO TEXTO - Input normal
          <>
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
          </>
        )}
      </View>
    </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(245, 245, 245, 0.7)', // Background semi-transparente
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Mais visível com transparência
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  voiceInputContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  recordButton: {
    backgroundColor: '#007AFF',
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
  },
  recordButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  recordingStatus: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
    backgroundColor: 'rgba(240, 240, 240, 0.95)', // Mais visível com transparência
    borderRadius: 15,
    marginVertical: 5,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  ttsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(230, 243, 255, 0.95)', // Mais visível com transparência
    borderRadius: 15,
    marginVertical: 5,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  ttsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  }
})