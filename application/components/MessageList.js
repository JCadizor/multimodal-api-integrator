import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Audio } from 'expo-av'
import { handleTTS } from '../scripts/utils'

export default function MessageList({ messages = [], configData = {} }) {
  const [playingAudio, setPlayingAudio] = useState(null);
  const [currentSound, setCurrentSound] = useState(null);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const scrollViewRef = useRef(null);

  // LIMPAR ÁUDIO AO DESMONTAR COMPONENTE
  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, [currentSound]);

  // SCROLL AUTOMÁTICO PARA NOVAS MENSAGENS
  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      // Delay pequeno para garantir que o layout foi atualizado
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // FUNÇÃO PARA REPRODUZIR MENSAGEM DA IA COM TTS
  const playAIMessage = async (messageText, messageId) => {
    try {
      // Parar qualquer reprodução anterior
      if (currentSound) {
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setPlayingAudio(null);
      }

      if (playingAudio === messageId) {
        // Se a mesma mensagem está sendo reproduzida, parar
        setIsTTSPlaying(false);
        return;
      }

      // Verificar se temos configurações para TTS
      if (!configData.hostnameAPI_TTS || !configData.portAPI) {
        Alert.alert('Aviso', 'Configurações de TTS não disponíveis');
        return;
      }

      console.log('🔊 Reproduzindo mensagem da IA com TTS:', messageText);
      setPlayingAudio(messageId);
      setIsTTSPlaying(true);

      await handleTTS(messageText, configData, setIsTTSPlaying);
      
      setPlayingAudio(null);
      setIsTTSPlaying(false);

    } catch (error) {
      console.error('❌ Erro ao reproduzir mensagem da IA:', error);
      Alert.alert('Erro', 'Não foi possível reproduzir a mensagem');
      setPlayingAudio(null);
      setIsTTSPlaying(false);
    }
  };
  const playAudio = async (audioUri, messageId) => {
    try {
      // Parar áudio anterior se estiver tocando
      if (currentSound) {
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setPlayingAudio(null);
      }

      if (playingAudio === messageId) {
        // Se o mesmo áudio está tocando, parar
        return;
      }

      console.log('🔊 Reproduzindo áudio:', audioUri);
      setPlayingAudio(messageId);

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      setCurrentSound(sound);

      // Quando o áudio terminar
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudio(null);
          setCurrentSound(null);
        }
      });

    } catch (error) {
      console.error('❌ Erro ao reproduzir áudio:', error);
      Alert.alert('Erro', 'Não foi possível reproduzir o áudio');
      setPlayingAudio(null);
    }
  };

  // FUNÇÃO PARA PARAR ÁUDIO OU TTS
  const stopAudio = async () => {
    try {
      if (currentSound) {
        await currentSound.unloadAsync();
        setCurrentSound(null);
      }
      setPlayingAudio(null);
      setIsTTSPlaying(false);
    } catch (error) {
      console.error('❌ Erro ao parar áudio:', error);
    }
  };
  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
    >
      {messages.map((message) => (
        <View 
          key={message.id} 
          style={[
            styles.messageContainer,
            message.sender === 'user' ? styles.userMessage : styles.aiMessage
          ]}
        >
          {/* INDICADOR DE MENSAGEM DE VOZ */}
          {message.isVoiceMessage && (
            <View style={styles.voiceMessageHeader}>
              <MaterialIcons 
                name="mic" 
                size={16} 
                color={message.sender === 'user' ? 'rgba(255,255,255,0.8)' : '#666'} 
              />
              <Text style={[
                styles.voiceLabel,
                message.sender === 'user' ? styles.voiceLabelUser : styles.voiceLabelAi
              ]}>
                Mensagem de voz
              </Text>
              {message.detectedLanguage && (
                <Text style={[
                  styles.languageLabel,
                  message.sender === 'user' ? styles.languageLabelUser : styles.languageLabelAi
                ]}>
                  ({message.detectedLanguage.code.toUpperCase()})
                </Text>
              )}
            </View>
          )}

          <Text style={[
            styles.messageText,
            message.sender === 'user' ? styles.userText : styles.aiText
          ]}>
            {message.text}
          </Text>

          {/* BOTÃO DE PLAYBACK PARA MENSAGENS COM ÁUDIO */}
          {message.isVoiceMessage && message.audioUri && (
            <TouchableOpacity 
              style={[
                styles.playbackButton,
                message.sender === 'user' ? styles.playbackButtonUser : styles.playbackButtonAi
              ]}
              onPress={() => playingAudio === message.id ? stopAudio() : playAudio(message.audioUri, message.id)}
            >
              <MaterialIcons 
                name={playingAudio === message.id ? "stop" : "play-arrow"} 
                size={20} 
                color={message.sender === 'user' ? 'white' : '#007AFF'} 
              />
              <Text style={[
                styles.playbackText,
                message.sender === 'user' ? styles.playbackTextUser : styles.playbackTextAi
              ]}>
                {playingAudio === message.id ? 'Parar' : 'Reproduzir áudio'}
              </Text>
            </TouchableOpacity>
          )}

          {/* BOTÃO DE TTS PARA MENSAGENS DA IA */}
          {message.sender === 'ai' && (
            <TouchableOpacity 
              style={[
                styles.playbackButton,
                styles.playbackButtonAi
              ]}
              onPress={() => playingAudio === message.id ? stopAudio() : playAIMessage(message.text, message.id)}
              disabled={isTTSPlaying && playingAudio !== message.id}
            >
              <MaterialIcons 
                name={playingAudio === message.id && isTTSPlaying ? "stop" : "volume-up"} 
                size={20} 
                color="#007AFF" 
              />
              <Text style={styles.playbackTextAi}>
                {playingAudio === message.id && isTTSPlaying ? 'Parar TTS' : 'Ouvir resposta'}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.timestamp}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 12,
    borderRadius: 15,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    marginLeft: '20%',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    marginRight: '20%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  voiceMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  voiceLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  voiceLabelUser: {
    color: 'rgba(255,255,255,0.9)',
  },
  voiceLabelAi: {
    color: '#666',
  },
  languageLabel: {
    fontSize: 10,
    marginLeft: 6,
    fontWeight: '600',
  },
  languageLabelUser: {
    color: 'rgba(255,255,255,0.7)',
  },
  languageLabelAi: {
    color: '#999',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#333',
  },
  playbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  playbackButtonUser: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  playbackButtonAi: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.3)',
  },
  playbackText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  playbackTextUser: {
    color: 'white',
  },
  playbackTextAi: {
    color: '#007AFF',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.7,
  }
})