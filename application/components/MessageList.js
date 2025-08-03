import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React from 'react'

export default function MessageList({ messages = [] }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {messages.map((message) => (
        <View 
          key={message.id} 
          style={[
            styles.messageContainer,
            message.sender === 'user' ? styles.userMessage : styles.aiMessage
          ]}
        >
          <Text style={[
            styles.messageText,
            message.sender === 'user' ? styles.userText : styles.aiText
          ]}>
            {message.text}
          </Text>
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
  timestamp: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.7,
  }
})