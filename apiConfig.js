// Configuração central da API
import axios from 'axios';

export const API_BASE = 'https://rotten-cats-cry.loca.lt';

// Configura o cabeçalho X-API-KEY para todas as requisições subsequentes do aplicativo
axios.defaults.headers.common['X-API-KEY'] = 'abanfar-iot-secret-token-2026';
