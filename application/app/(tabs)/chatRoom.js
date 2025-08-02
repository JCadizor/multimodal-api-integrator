import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MessageList from '../../components/MessageList';

export default function ChatRoom() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity  onPress={() => router.back()} style={{ backgroundColor: "red" }}>
          <MaterialIcons name="arrow-back" size={24} color="blue" style={{ paddingTop: 20 }} />
        </TouchableOpacity>
        <View style={styles.content}>
            <Text style={styles.text}>Chat Room Content</Text>
            <MessageList />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 20,
  },
  text: {
    color: 'blue',
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 20,
  },
  buttonText: {
    color: 'blue',
    textAlign: 'center',
    fontSize: 16,
    textDecorationLine: 'underline',
  }
})