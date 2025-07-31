import { View, Text } from 'react-native'
import React from 'react'
import {Stack} from 'expo-router'

export default function ChatRoom() {
  return (
    <Stack.Screen
      options={{
        title: 'Analista de horarios',
      }}>
      <View>
        <Text>ChatRoom</Text>
      </View>
    </Stack.Screen>
  )
}