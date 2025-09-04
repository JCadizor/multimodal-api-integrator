/**
 * Template para adicionar timestamps aos logs
 * 
 * Use este formato para substituir os console.log existentes:
 * 
 * ANTES:
 * console.log('Mensagem', variavel);
 * console.error('Erro:', error);
 * console.warn('Aviso');
 * 
 * DEPOIS:
 * console.log(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] Mensagem`, variavel);
 * console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] Erro:`, error);
 * console.warn(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] Aviso`);
 * 
 * SAÍDA EXEMPLO:
 * [14:32:45.123] Mensagem {...}
 * [14:32:45.124] Erro: Network Error
 * [14:32:45.125] Aviso
 * 
 * DICA: Para facilitar, você pode usar Find & Replace no VS Code:
 * 
 * 1. Pressione Ctrl+H
 * 2. Ative Regex (.*) 
 * 3. Find: console\.(log|error|warn)\(([^)]+)\)
 * 4. Replace: console.$1(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] $2`)
 * 
 * Ou use este snippet do VS Code para rapidez:
 */

// Snippet sugerido para VS Code (adicionar em settings.json):
/*
"Log with Timestamp": {
    "prefix": "logts",
    "body": [
        "console.log(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] $1`, $2);"
    ],
    "description": "Console log with timestamp"
},
"Error with Timestamp": {
    "prefix": "rrts", 
    "body": [
        "console.error(`[${new Date().toLocaleTimeString('pt-PT', {hour12: false, fractionalSecondDigits: 3})}] $1`, $2);"
    ],
    "description": "Console error with timestamp"
}
*/
