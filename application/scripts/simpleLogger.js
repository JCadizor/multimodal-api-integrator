/**
 * Logger simples com timestamp usando Date.now()
 */

// Função simples para obter timestamp legível
export const getTimestamp = () => {
  return new Date().toLocaleTimeString('pt-PT', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit', 
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

// Função ainda mais simples - só o horário
export const getTime = () => new Date().toLocaleTimeString();

// Wrapper simples para console.log com timestamp
export const log = (...args) => console.log(`[${getTimestamp()}]`, ...args);
