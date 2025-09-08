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
   * @param {string|null} QueryParams - Nome do colaborador OU queryParams estruturado (ex: "date:2025-09-05, name:João") (opcional)
   */
  async getAttendance(QueryParams = null) {
    log(`[attendanceAPI.js] START getAttendance`);
    try {
      await this.configure();
      
      log(`[attendanceAPI.js] 🔍 DEBUG: Parâmetros recebidos - QueryParams: "${QueryParams}"`);
      
      let finalName = null;
      let finalDate = null;

      // Se o primeiro parâmetro contém ":" ou "," pode ser queryParams estruturado
      if (QueryParams && (QueryParams.includes(':') || QueryParams.includes(','))) {
        log(`[attendanceAPI.js] 🔍 DEBUG: Detectado queryParams estruturado, processando...`);

        const params = QueryParams.split(',').map(p => p.trim());

        params.forEach(param => {
          log(`[attendanceAPI.js] 🔍 DEBUG: processando parâmetro: "${param}"`);
          if (param.startsWith('date:')) {
            const dateParam = param.replace('date:', '');
            if (dateParam === 'hoje') {
              finalDate = new Date().toISOString().split('T')[0];
            } else {
              finalDate = dateParam;
            }
            log(`[attendanceAPI.js] 🔍 DEBUG: finalDate definido como: "${finalDate}"`);
          } else if (param.startsWith('name:')) {
            finalName = param.replace('name:', '');
            log(`[attendanceAPI.js] 🔍 DEBUG: finalName definido como: "${finalName}"`);
          } else if (!param.includes(':')) {
            // Se não tem prefixo, assumir que é nome
            finalName = param;
            log(`[attendanceAPI.js] 🔍 DEBUG: finalName (sem prefixo) definido como: "${finalName}"`);
          }
        });
      } else if (nameOrQueryParams) {
        // Parâmetro simples - é um nome
        finalName = nameOrQueryParams;
        log(`[attendanceAPI.js] 🔍 DEBUG: Usando como nome simples: "${finalName}"`);
      }
      
      log(`[attendanceAPI.js] 🔍 DEBUG: Parâmetros finais - finalName: "${finalName}", finalDate: "${finalDate}"`);
      
      const urlParams = new URLSearchParams();
      if (finalName) {
        log(`[attendanceAPI.js] 🔍 DEBUG: Adicionando name ao params: "${finalName}"`);
        urlParams.append('name', finalName);
      }
      if (finalDate) {
        log(`[attendanceAPI.js] 🔍 DEBUG: Adicionando date ao params: "${finalDate}"`);
        urlParams.append('date', finalDate);
      }
      
      const url = `${this.baseUrl}/attendance${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      log(`[attendanceAPI.js] URL a ser chamada:`, url);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      log(`[attendanceAPI.js] ✅ Registos de assiduidade obtidos`);
      return data; // Retornar resposta bruta da API

    } catch (error) {
      errorlog(`[attendanceAPI.js] ❌ Erro ao obter registos:`, error);
      log(`[attendanceAPI.js] END getAttendance`);
      return { success: false, error: error.message};
    }
  }

  /**
   * Criar novo registo de assiduidade
   * @param {Object} attendanceData - Dados do registo
   
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
      return data;

    } catch (error) {
      errorlog(`[attendanceAPI.js] ❌ Erro ao criar registo:`, error);
      return { success: false, error: error.message };
    }
  }
*/
  /**
   * Obter registo específico por ID
   * @param {number} id - ID do registo
   */
  async getAttendanceById(id) {
    log(`[attendanceAPI.js] START getAttendanceById`);
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
      return data;

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
      return data;

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
    log(`[attendanceAPI.js] START checkEmployeeEntryToday`);
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const result = await this.getAttendance(employeeName, today);
      
      // Retornar a resposta raw da API sem modificações
      log(`[attendanceAPI.js] END checkEmployeeEntryToday`);
      return result;

    } catch (error) {
      log(`[attendanceAPI.js] END checkEmployeeEntryToday`);
      errorlog(`[attendanceAPI.js] ❌ Erro ao verificar entrada do colaborador:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Registar entrada de colaborador
   * @param {string} name - Nome do colaborador
   * @param {string} location - Local (opcional)
 
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
  }  */
}

// Instância singleton da API
const attendanceAPI = new AttendanceAPI();

export default attendanceAPI;

// Exportar funções individuais para compatibilidade
export const checkEmployeeEntry = (name) => attendanceAPI.checkEmployeeEntryToday(name);
export const getAttendanceRecords = (name, date) => attendanceAPI.getAttendance(name, date);
export const createAttendanceRecord = (data) => attendanceAPI.createAttendance(data);
export const getEmployeeHistory = (name, limit) => attendanceAPI.getHistory(name, limit);
