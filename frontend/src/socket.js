// Client Socket.io singleton verso il backend (stessa origin dell'API).
// autoConnect:false → la connessione parte solo quando la dashboard monta
// (post-login), e si chiude allo smontaggio.
import { io } from 'socket.io-client';
import { API_BASE } from './api';

export const socket = io(API_BASE, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});
