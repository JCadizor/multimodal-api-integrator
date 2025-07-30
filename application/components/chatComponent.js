// components/chatComponent.js só mente para tratar da comunicação text to text
import React, { useState } from 'react';
import { View,StyleSheet, TextInput, Button, Text, ScrollView } from 'react-native';
import { startTextToTextStream } from '../scripts/handleComunication.js';
import {fetch} from 'expo/fetch'; // Importando fetch do expo para garantir compatibilidade

export default function ChatComponent() { 
    const [chatInput, setChatInput] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!chatInput.trim()) return; // Não enviar se o input estiver vazio
    
        setResponse('');       // Limpar a resposta anterior
        setLoading(true);      // Iniciar o estado de loading

        try {
            await startTextToTextStream({
                prompt: chatInput,
                messages: [], // passagem de mensagens, neste momento não ainda em fases de desenvolvimento por isso não inlcuimos as mensages anteriores.
                onData: (chunk)=> {
                    // Atualizar a resposta com os dados recebidos, chato ter que usar uma função de callback para atualizar o estado
                    // mas é necessário para garantir que o estado é atualizado corretamente
                    setResponse(prev => prev + chunk);
                },
                onDone: () => {
                    setLoading(false); // Finalizar o estado de loading
                },
                 onError: (error) => {
                    console.error('Erro:', error);
                    setResponse('❌ Erro ao processar a resposta.');
                    setLoading(false);
                }
                });
                
                setChatInput(''); // Limpar o input após o envio
            } catch (err) {
                console.error('Erro no envio:', err);
                setResponse('❌ Erro ao iniciar o stream.');
                setLoading(false);
                }
            };

      return (
    <View style={{ flex: 1, padding: 2,}}>
      <ScrollView style ={styles.container } >
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Chat</Text>
        {/* Exibir a resposta recebida */}
        <Text style={{ fontSize: 16 }}>{response}</Text>
      </ScrollView>

      <TextInput
        style={styles.input}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        onSubmitEditing={handleSend}
        returnKeyType="send"
        placeholder="Escreve a tua pergunta..."
        value={chatInput}
        onChangeText={setChatInput}
      />

      <Button title={loading ? 'A pensar...' : 'Enviar'} onPress={handleSend} disabled={loading} />
    </View>
  );
}
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginBottom: 1,
      backgroundColor: '#fff',
      padding: 10,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4

    },
    input: {
      borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 10,
          borderRadius: 8,
          backgroundColor: '#f9f9f9'
    }
  });

