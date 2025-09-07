import { Alert } from 'react-native';
import { retrieveAsyncStorageDataAsJson } from './utils.js';
import { fetch } from 'expo/fetch';
import { log, errorlog, warn } from './simpleLogger.js';

/**
 * Classe para interação com a API REST de Assiduidade
 * Baseada no manual FLASK_API_INTEGRATION_MANUAL
 */
class AttendanceAPI {
  constructor() {
    this.baseUrl = 'https://flask-attendance-api-ymvx.onrender.com';
    this.apiKey = 'desenvolvimento_key_123';
    this.headers = {
      'X-API-KEY': this.apiKey,
      'Content-Type': 'application/json'
    };
  }


  /**
   * Configurar API com dados personalizados do utilizador
   */
  async configure() {
    try {
      const userData = await retrieveAsyncStorageDataAsJson();
      if (userData && userData.attendanceApiKey) {
        this.apiKey = userData.attendanceApiKey;
        this.headers['X-API-KEY'] = this.apiKey;
      }
      if (userData && userData.attendanceBaseUrl) {
        this.baseUrl = userData.attendanceBaseUrl;
      }
      log(`[attendanceAPI.js] 📡 API de Assiduidade configurada:`, this.baseUrl);
    } catch (error) {
      warn(`[attendanceAPI.js] ⚠️ Usando configurações padrão da API de Assiduidade`);
    }
  }

  /**
   * Verificar status da API
   */
  async checkStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET'
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      errorlog(`[attendanceAPI.js] ❌ Erro ao verificar status da API:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter informações de autenticação
   */
  async getAuthInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/auth-info`, {
        method: 'GET'
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      errorlog(`[attendanceAPI.js] ❌ Erro ao obter info de autenticação:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter registos de assiduidade
   * @param {string} name - Nome do colaborador (opcional)
   * @param {string} date - Data no formato YYYY-MM-DD (opcional)
   */
  async getAttendance(name = null, date = null) {
    try {
      await this.configure();
      
      const params = new URLSearchParams();
      if (name) params.append('name', name);
      if (date) params.append('date', date);
      
      const url = `${this.baseUrl}/attendance${params.toString() ? '?' + params.toString() : ''}`;
      log(`[attendanceAPI.js] URL a ser chamada:`, url);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      log(`[attendanceAPI.js] ✅ Registos de assiduidade obtidos:`, data);
      return { success: true, data };

    } catch (error) {
      errorlog(`[attendanceAPI.js] ❌ Erro ao obter registos:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Criar novo registo de assiduidade
   * @param {Object} attendanceData - Dados do registo
   */
  async createAttendance(attendanceData) {
    try {
      await this.configure();
      
      // Validação dos dados obrigatórios
      if (!attendanceData.name || !attendanceData.date) {
        throw new Error('Nome e data são obrigatórios');
      }

      const response = await fetch(`${this.baseUrl}/attendance`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(attendanceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      log(`[attendanceAPI.js] ✅ Registo criado com sucesso:`, data);
      return { success: true, data };

    } catch (error) {
      errorlog(`[attendanceAPI.js] ❌ Erro ao criar registo:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter registo específico por ID
   * @param {number} id - ID do registo
   */
  async getAttendanceById(id) {
    try {
      await this.configure();
      
      const response = await fetch(`${this.baseUrl}/attendance/${id}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Registo não encontrado');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      log(`[attendanceAPI.js] ✅ Registo obtido:`, data);
      return { success: true, data };

    } catch (error) {
      errorlog(`[attendanceAPI.js] ❌ Erro ao obter registo por ID:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter histórico de registos por colaborador
   * @param {string} name - Nome do colaborador
   * @param {number} limit - Número máximo de registos (padrão: 10)
   */
  async getHistory(name, limit = 10) {
    try {
      await this.configure();
      
      if (!name) {
        throw new Error('Nome do colaborador é obrigatório');
      }

      const params = new URLSearchParams({
        name: name,
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}/attendance/history?${params}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      log(`[attendanceAPI.js] ✅ Histórico obtido:`, data);
      return { success: true, data };

    } catch (error) {
      errorlog(`[attendanceAPI.js] ❌ Erro ao obter histórico:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar se um colaborador já entrou hoje
   * @param {string} employeeName - Nome do colaborador
   */
  async checkEmployeeEntryToday(employeeName) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const result = await this.getAttendance(employeeName, today);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const records = result.data;
      
      if (records.length > 0 && records[0].time_entry) {
        const message = `Sim — o ${employeeName} entrou hoje às ${records[0].time_entry}.`;
        return { 
          success: true, 
          hasEntered: true, 
          message: message,
          entryTime: records[0].time_entry,
          record: records[0]
        };
      } else {
        const message = `Hoje o ${employeeName} ainda não entrou na empresa.`;
        return { 
          success: true, 
          hasEntered: false, 
          message: message 
        };
      }

    } catch (error) {
      errorlog(`[attendanceAPI.js] ❌ Erro ao verificar entrada do colaborador:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Registar entrada de colaborador
   * @param {string} name - Nome do colaborador
   * @param {string} location - Local (opcional)
   */
  async recordEntry(name, location = null) {
    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

      const attendanceData = {
        name: name,
        date: date,
        time_entry: time
      };

      if (location) {
        attendanceData.location = location;
      }

      return await this.createAttendance(attendanceData);

    } catch (error) {
      errorlog(`[attendanceAPI.js] ❌ Erro ao registar entrada:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Processar query em linguagem natural sobre assiduidade
   * @param {string} query - Pergunta do utilizador
   */
  async processNaturalQuery(query) {
    try {
      // Análise simples de padrões na query
      const lowerQuery = query.toLowerCase();
      
      // Padrão: "colaborador X já entrou hoje?"
      const entryPattern = /(.+?)\s+(já\s+entrou|entrou)\s+(hoje|hoj)/i;
      const entryMatch = query.match(entryPattern);
      
      if (entryMatch) {
        const employeeName = entryMatch[1].trim();
        return await this.checkEmployeeEntryToday(employeeName);
      }

      // Padrão: "histórico do colaborador X"
      const historyPattern = /(histórico|historia)\s+(do|da)?\s*(.+)/i;
      const historyMatch = query.match(historyPattern);
      
      if (historyMatch) {
        const employeeName = historyMatch[3].trim();
        return await this.getHistory(employeeName);
      }

      // Padrão: "registos de hoje"
      if (lowerQuery.includes('registos') && lowerQuery.includes('hoje')) {
        const today = new Date().toISOString().split('T')[0];
        return await this.getAttendance(null, today);
      }

      // Padrão genérico - listar todos os registos
      if (lowerQuery.includes('listar') || lowerQuery.includes('todos')) {
        return await this.getAttendance();
      }

      return {
        success: false,
        error: 'Não consegui entender a pergunta. Experimente perguntas como: "João já entrou hoje?" ou "histórico do João"'
      };

    } catch (error) {
      errorlog(`[attendanceAPI.js] ❌ Erro ao processar query natural:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Formatar resposta para apresentação ao utilizador
   * @param {Object} result - Resultado da API
   * @param {string} queryType - Tipo de consulta
   */
  formatResponse(result, queryType = 'general') {
    if (!result.success) {
      return `Erro: ${result.error}`;
    }

    switch (queryType) {
      case 'entry_check':
        return result.message;
      
      case 'history':
        if (result.data && result.data.length > 0) {
          const records = result.data.slice(0, 5); // Mostrar apenas os primeiros 5
          let response = `Últimos registos:\n`;
          records.forEach(record => {
            response += `📅 ${record.date} - Entrada: ${record.time_entry || 'N/A'}`;
            if (record.time_exit) response += ` - Saída: ${record.time_exit}`;
            if (record.location) response += ` - Local: ${record.location}`;
            response += '\n';
          });
          return response;
        } else {
          return 'Nenhum registo encontrado.';
        }
      
      case 'list':
        if (result.data && result.data.length > 0) {
          const records = result.data.slice(0, 3); // Mostrar apenas os primeiros 3
          let response = `Registos encontrados (${result.data.length}):\n`;
          records.forEach(record => {
            response += `👤 ${record.name} - ${record.date}`;
            if (record.time_entry) response += ` às ${record.time_entry}`;
            response += '\n';
          });
          if (result.data.length > 3) {
            response += `... e mais ${result.data.length - 3} registos.`;
          }
          return response;
        } else {
          return 'Nenhum registo encontrado.';
        }
      
      default:
        return JSON.stringify(result.data, null, 2);
    }
  }
}

// Instância singleton da API
const attendanceAPI = new AttendanceAPI();

export default attendanceAPI;

// Exportar funções individuais para compatibilidade
export const checkEmployeeEntry = (name) => attendanceAPI.checkEmployeeEntryToday(name);
export const getAttendanceRecords = (name, date) => attendanceAPI.getAttendance(name, date);
export const createAttendanceRecord = (data) => attendanceAPI.createAttendance(data);
export const getEmployeeHistory = (name, limit) => attendanceAPI.getHistory(name, limit);
export const processAttendanceQuery = (query) => attendanceAPI.processNaturalQuery(query);
