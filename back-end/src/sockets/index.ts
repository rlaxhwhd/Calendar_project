import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

import { env } from '../config/env';

let io: Server;

export const initializeSocketIO = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // 캘린더 룸 입장
    socket.on('joinCalendar', (calendarSlug: string) => {
      socket.join(calendarSlug);
      console.log(`📅 Socket ${socket.id} joined calendar: ${calendarSlug}`);
    });

    // 투표 제출
    socket.on('submitVote', (data) => {
      const { calendarSlug, voteData } = data;
      // 같은 캘린더의 다른 사용자들에게 브로드캐스트
      socket.to(calendarSlug).emit('voteUpdated', voteData);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
};
