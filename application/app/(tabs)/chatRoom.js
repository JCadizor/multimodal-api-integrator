import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, Switch, ImageBackground } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
import attendanceAPI from '../../scripts/attendanceAPI';
import { log } from '../../scripts/simpleLogger.js';

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
    log('Modo inicial do chat:', initialMode);
    
    // Configurar modo de voz baseado no parâmetro de navegação
    if (initialMode === 'voice') {
      log('🎤 Chat iniciado em modo VOZ - gravação ativada automaticamente');
      setIsVoiceModeEnabled(true);
    } else {
      log('📝 Chat iniciado em modo TEXTO - input de texto ativado');
      setIsVoiceModeEnabled(false);
    }
    
    initializeChat();
  }, []);

  // RECARREGAR CONFIGURAÇÕES QUANDO A TELA ENTRA EM FOCO
  useFocusEffect(
    React.useCallback(() => {
      log('🔄 Tela em foco - recarregando configurações...');
      loadConfig();
    }, [])
  );

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
        log('🔧 Configurações carregadas:', {
          selectedVoice: data.selectedVoice,
          selectedSTTModel: data.selectedSTTModel,
          defaultLanguage: data.defaultLanguage,
          attendanceApiKey: data.attendanceApiKey ? '***' : 'não definida',
          attendanceBaseUrl: data.attendanceBaseUrl
        });
      } else {
        log('⚠️ Nenhuma configuração encontrada - usando valores padrão');
      }
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] ❌ Erro ao carregar configurações:`, error);
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
      console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] Erro ao configurar áudio:`, error);
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
      console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] Erro ao carregar mensagens:`, error);
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
      console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] Erro ao salvar mensagens:`, error);
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
      
      // PERSISTÊNCIA IMEDIATA - Salva após adicionar mensagem do utilizador
      await saveMessages(updatedMessages);
      
      // Processar resposta da IA
      await processAIResponse(updatedMessages);
    }
  };

  // FUNÇÃO PARA PROCESSAR RESPOSTA DA IA
  const processAIResponse = async (currentMessages) => {
    // INDICADOR DE QUE A IA ESTÁ PROCESSANDO
    setIsAiTyping(true);
    
    log('📝 Processando resposta da IA...');
    log('🔊 Modo de voz:', isVoiceModeEnabled ? 'ATIVO' : 'INATIVO');
    
    try {
      // PROCESSAMENTO COM API DE CHAT (agora sempre vai para a IA primeiro)
      await processNormalChatResponse(currentMessages);

    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] ❌ Erro geral no processamento da IA:`, error);
      await createErrorResponse(currentMessages, 'Erro inesperado. Tente novamente.');
    }
  };

  // FUNÇÃO PARA PROCESSAMENTO NORMAL DE CHAT
  const processNormalChatResponse = async (currentMessages) => {
    // Preparar mensagens para a API (formato esperado pela API)
    const lastUserMessage = currentMessages[currentMessages.length - 1];
    const userPrompt = lastUserMessage.text;
    
    // PROMPT ESPECIAL PARA O AGENTE DE IA
    const systemPrompt = `Você é um assistente inteligente que pode ajudar com várias tarefas, incluindo consultas sobre dados de assiduidade de colaboradores.

IMPORTANTE - Sistema de Consulta de Assiduidade:
Se o utilizador fizer perguntas relacionadas com assiduidade, presença, entrada, saída ou dados de colaboradores/funcionários, deves solicitar os dados que precisas para a resposta seguindo EXATAMENTE este formato:

Para consultar dados, use: [ATTENDANCE_QUERY: tipo_consulta | parâmetros]

Tipos de consulta disponíveis:
- check_entry: Verificar se um colaborador entrou hoje
- get_history: Obter histórico de um colaborador  
- get_records: Obter registos por data ou nome
- list_all: Listar todos os registos

Exemplos:
- "O João já entrou hoje?" → Responda: [ATTENDANCE_QUERY: check_entry | João]
- "Histórico do Pedro" → Responda: [ATTENDANCE_QUERY: get_history | Pedro]  
- "Quem entrou hoje?" → Responda: [ATTENDANCE_QUERY: get_records | date:hoje]
- "Registos da semana passada" → Responda: [ATTENDANCE_QUERY: get_records | date:semana_passada]

IMPORTANTE: Use EXATAMENTE este formato com colchetes, dois pontos e pipe (|). Não adicione explicações junto com a query - a query deve ser uma linha separada.
As respostas a este tipo de perguntas devem de ser curtas e objetivas.
IMPORTANTE: usa linguagem natural e sem sinais de pontuações contrutores, este texto pode ser lido em voz alta por sintetizadores de voz.Não deves responder com **Detalhes:** * **Hora de entrada:** ... * **Hora de saída:** ... etc.

Para outros assuntos, responda normalmente como um assistente prestável.`;

    const prompt = systemPrompt + "\n\nutilizador: " + userPrompt;
    
    // Converter histórico de mensagens para formato da API
    const apiMessages = currentMessages
      .filter(msg => msg.sender !== 'ai' || msg.text !== "Olá! Como posso ajudá-lo hoje?") // Filtrar mensagem inicial
      .slice(-10) // Limitar a 10 mensagens mais recentes para contexto
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

    log('📡 Enviando para API:', { prompt, messages: apiMessages });

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
      log('✅ Stream finalizado. Resposta completa:', aiResponse.text);
      
      // DETECTAR SE A IA SOLICITOU DADOS DE ASSIDUIDADE
      const attendanceQueryMatch = aiResponse.text.match(/\[ATTENDANCE_QUERY:\s*([^|]+)\s*\|\s*([^\]]+)\]/);
      
      if (attendanceQueryMatch) {
        log('🏢 IA solicitou dados de assiduidade:', attendanceQueryMatch[0]);
        
        const queryType = attendanceQueryMatch[1].trim();
        const queryParams = attendanceQueryMatch[2].trim();
        
        // Processar a solicitação de assiduidade
        await processAttendanceRequest(currentMessages, aiResponse, queryType, queryParams);
        return;
      }
      
      // Marcar como não-streaming e salvar mensagem final
      aiResponse.isStreaming = false;
      const finalMessages = [...currentMessages, aiResponse];
      setMessages(finalMessages);
      await saveMessages(finalMessages);

      // INTEGRAÇÃO TTS SE O MODO VOZ ESTIVER ATIVO
      if (isVoiceModeEnabled && aiResponse.text.trim()) {
        log('🔊 Modo de voz ativo - Executando TTS...');
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
      createErrorResponse(currentMessages, 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
    };

    // Iniciar stream da API
    await startTextToTextStream({
      prompt,
      messages: apiMessages,
      onData,
      onDone,
      onError
    });
  };

  // NOVA FUNÇÃO PARA PROCESSAR SOLICITAÇÕES DE ASSIDUIDADE DA IA
  const processAttendanceRequest = async (currentMessages, aiResponse, queryType, queryParams) => {
    try {
      log('🏢 Processando solicitação de assiduidade da IA:', { queryType, queryParams });
      
      // Atualizar mensagem da IA para mostrar que está consultando dados
      aiResponse.text = "Consultando dados de assiduidade...";
      aiResponse.isStreaming = true;
      
      let tempMessages = [...currentMessages, aiResponse];
      setMessages(tempMessages);
      
      let result;
      
      // Processar diferentes tipos de consulta
      switch (queryType) {
        case 'check_entry':
          result = await attendanceAPI.checkEmployeeEntryToday(queryParams);
          break;
          
        case 'get_history':
          result = await attendanceAPI.getHistory(queryParams, 10);
          break;
          
        case 'get_records':
          if (queryParams.startsWith('date:')) {
            const dateParam = queryParams.replace('date:', '');
            let date = null;
            
            if (dateParam === 'hoje') {
              date = new Date().toISOString().split('T')[0];
            }
            // Adicionar mais lógica de datas se necessário
            
            result = await attendanceAPI.getAttendance(null, date);
          } else {
            result = await attendanceAPI.getAttendance(queryParams, null);
          }
          break;
          
        case 'list_all':
          result = await attendanceAPI.getAttendance();
          break;
          
        default:
          result = { success: false, error: 'Tipo de consulta não reconhecido' };
      }
      
      log('🏢 Resultado da consulta de assiduidade:', result);
      
      // Preparar dados para enviar de volta à IA
      let attendanceData;
      if (result.success) {
        if (result.hasEntered !== undefined) {
          // Resultado de verificação de entrada
          attendanceData = {
            type: 'check_entry',
            employee: queryParams,
            hasEntered: result.hasEntered,
            message: result.message,
            entryTime: result.entryTime || null
          };
        } else if (Array.isArray(result.data)) {
          // Resultado de consulta de registos
          attendanceData = {
            type: 'records',
            data: result.data.map(record => ({
              name: record.name,
              date: record.date,
              timeEntry: record.time_entry,
              timeExit: record.time_exit,
              location: record.location
            }))
          };
        } else {
          attendanceData = { type: 'other', data: result.data };
        }
      } else {
        attendanceData = { type: 'error', error: result.error };
      }
      
      // Enviar dados de volta para a IA processar e formatar resposta final
      await sendAttendanceDataToAI(currentMessages, aiResponse, attendanceData, queryParams);
      
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] ❌ Erro ao processar solicitação de assiduidade:`, error);
      
      // Atualizar mensagem com erro
      aiResponse.text = "Desculpe, ocorreu um erro ao consultar os dados de assiduidade.";
      aiResponse.isStreaming = false;
      
      const finalMessages = [...currentMessages, aiResponse];
      setMessages(finalMessages);
      await saveMessages(finalMessages);
      setIsAiTyping(false);
    }
  };

  // FUNÇÃO PARA ENVIAR DADOS DE ASSIDUIDADE DE VOLTA À IA
  const sendAttendanceDataToAI = async (currentMessages, aiResponse, attendanceData, originalQuery) => {
    try {
      log('🤖 Enviando dados de assiduidade para a IA processar...');
      
      // Prompt para a IA processar os dados e dar uma resposta amigável
      const dataProcessingPrompt = `Com base nos dados de assiduidade fornecidos abaixo, formule uma resposta clara e amigável para o utilizador.
      
Query original: "${originalQuery}"
Dados de assiduidade: ${JSON.stringify(attendanceData, null, 2)}

Formate a resposta de forma natural e amigável. Se houver dados, apresente-os de forma organizada. Se houver erros, explique de forma compreensível.
Não inclua a tag [ATTENDANCE_QUERY] na resposta final.`;

      // Criar uma nova mensagem temporária para receber a resposta processada
      aiResponse.text = "";
      aiResponse.isStreaming = true;
      
      let tempMessages = [...currentMessages, aiResponse];
      setMessages(tempMessages);

      const onData = (content) => {
        aiResponse.text += content;
        tempMessages = [...currentMessages, { ...aiResponse }];
        setMessages(tempMessages);
      };

      const onDone = async () => {
        log('✅ Resposta final da IA processada:', aiResponse.text);
        
        // Finalizar mensagem
        aiResponse.isStreaming = false;
        const finalMessages = [...currentMessages, aiResponse];
        setMessages(finalMessages);
        await saveMessages(finalMessages);

        // TTS se modo voz estiver ativo
        if (isVoiceModeEnabled && aiResponse.text.trim()) {
          log('🔊 Modo de voz ativo - Executando TTS para resposta de assiduidade...');
          try {
            if (configData.hostnameAPI_TTS && configData.portAPI) {
              await handleTTS(aiResponse.text, configData, setIsTTSPlaying);
            }
          } catch (error) {
            console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] ❌ Erro no TTS:`, error);
          }
        }

        setIsAiTyping(false);
      };

      const onError = (error) => {
        console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] ❌ Erro ao processar resposta final:`, error);
        aiResponse.text = "Dados consultados, mas ocorreu um erro ao formatar a resposta.";
        aiResponse.isStreaming = false;
        
        const finalMessages = [...currentMessages, aiResponse];
        setMessages(finalMessages);
        setIsAiTyping(false);
      };

      // Enviar para a IA processar
      await startTextToTextStream({
        prompt: dataProcessingPrompt,
        messages: [], // Não incluir histórico para esta consulta específica
        onData,
        onDone,
        onError
      });

    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] ❌ Erro ao enviar dados para IA:`, error);
      
      aiResponse.text = "Erro ao processar dados de assiduidade.";
      aiResponse.isStreaming = false;
      
      const finalMessages = [...currentMessages, aiResponse];
      setMessages(finalMessages);
      setIsAiTyping(false);
    }
  };

  // FUNÇÃO UTILITÁRIA PARA CRIAR RESPOSTAS DE ERRO
  const createErrorResponse = async (currentMessages, errorMessage) => {
    const errorResponse = {
      id: Date.now() + 1,
      text: errorMessage,
      sender: "ai",
      timestamp: new Date(),
      isError: true
    };
    
    const errorMessages = [...currentMessages, errorResponse];
    setMessages(errorMessages);
    await saveMessages(errorMessages);
    setIsAiTyping(false);
    
    Alert.alert('Erro', errorMessage);
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
    
    // Feedback para o utilizador
    Alert.alert(
      'Modo de Voz',
      newMode 
        ? 'Modo de voz ativado! Pressione o botão do microfone para gravar sua mensagem.' 
        : 'Modo de voz desativado. Voltando ao modo texto.',
      [{ text: 'OK' }]
    );
    
    log('🔊 Modo de voz:', newMode ? 'ATIVADO' : 'DESATIVADO');
  };

  // FUNÇÃO PARA INICIAR GRAVAÇÃO DE VOZ
  const startRecording = async () => {
    try {
      log('🎤 Iniciando gravação...');
      
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
                <Text style={styles.typingText}>IA está a escrever...</Text>
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