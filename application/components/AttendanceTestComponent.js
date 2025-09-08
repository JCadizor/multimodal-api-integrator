import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import attendanceAPI from '../scripts/attendanceAPI';

export default function AttendanceTestComponent() {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (title, result) => {
    const newResult = {
      id: Date.now(),
      title,
      result: JSON.stringify(result, null, 2),
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [newResult, ...prev.slice(0, 4)]); // Manter apenas os últimos 5
  };

  const testApiStatus = async () => {
    setIsLoading(true);
    try {
      const result = await attendanceAPI.checkStatus();
      addTestResult('Status da API', result);
      if (result.success) {
        Alert.alert('Sucesso', 'API está online!');
      } else {
        Alert.alert('Erro', 'API não está disponível');
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
    setIsLoading(false);
  };

  const testEmployeeQuery = async () => {
    setIsLoading(true);
    try {
      const result = await attendanceAPI.checkEmployeeEntryToday('João Silva');
      addTestResult('Verificar Entrada', result);
      Alert.alert('Resultado', result.message || JSON.stringify(result));
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
    setIsLoading(false);
  };

  const testNaturalQuery = async () => {
    setIsLoading(true);
    try {
      // Teste direto das funções da API em vez de processNaturalQuery
      const testOptions = [
        { name: 'João', action: 'checkEmployeeEntryToday' },
        { name: 'Colaborador A', action: 'checkEmployeeEntryToday' },
        { name: 'João', action: 'getHistory', limit: 5 },
        { date: new Date().toISOString().split('T')[0], action: 'getAttendance' }
      ];
      
      const randomTest = testOptions[Math.floor(Math.random() * testOptions.length)];
      let result;
      let queryDesc;
      
      switch (randomTest.action) {
        case 'checkEmployeeEntryToday':
          result = await attendanceAPI.checkEmployeeEntryToday(randomTest.name);
          queryDesc = `Verificar entrada de ${randomTest.name} hoje`;
          break;
        case 'getHistory':
          result = await attendanceAPI.getHistory(randomTest.name, randomTest.limit);
          queryDesc = `Histórico de ${randomTest.name}`;
          break;
        case 'getAttendance':
          result = await attendanceAPI.getAttendance(null, randomTest.date);
          queryDesc = `Registos de hoje (${randomTest.date})`;
          break;
      }
      
      addTestResult(`Teste: "${queryDesc}"`, result);
      
      if (Array.isArray(result)) {
        Alert.alert('Sucesso', `Encontrados ${result.length} registos`);
      } else if (result && !result.success) {
        Alert.alert('Erro', result.error);
      } else {
        Alert.alert('Sucesso', 'Teste executado com sucesso');
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
    setIsLoading(false);
  };

  const testGetAllRecords = async () => {
    setIsLoading(true);
    try {
      const result = await attendanceAPI.getAttendance();
      addTestResult('Todos os Registos', result);
      
      if (result.success && result.data.length > 0) {
        Alert.alert('Registos', `Encontrados ${result.data.length} registos`);
      } else {
        Alert.alert('Info', 'Nenhum registo encontrado');
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Teste da API de Assiduidade</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testApiStatus}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Testar Status da API</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testEmployeeQuery}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Verificar Entrada de Colaborador</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testNaturalQuery}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Teste de Query Natural</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testGetAllRecords}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Obter Todos os Registos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.clearButtonText}>Limpar Resultados</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Testando API...</Text>
        </View>
      )}

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Resultados dos Testes ({testResults.length}):</Text>
        {testResults.map((result) => (
          <View key={result.id} style={styles.resultItem}>
            <Text style={styles.resultTitle}>{result.title}</Text>
            <Text style={styles.resultTime}>{result.timestamp}</Text>
            <Text style={styles.resultText} numberOfLines={10}>{result.result}</Text>
          </View>
        ))}
        {testResults.length === 0 && (
          <Text style={styles.noResultsText}>Nenhum teste executado ainda.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  resultTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 5,
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
