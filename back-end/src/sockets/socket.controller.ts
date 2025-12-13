import { CustomSocket } from '../types/socket.types';

export class CalendarSocketController {
  public handleSocketEvent(socket: CustomSocket) {
    socket.on('joinCalendarRoom', () => {
      this.joinCalendarRoom(socket);
    });

    socket.on('leaveCalendarRoom', () => {
      this.handleLeave(socket);
      console.log(
        `유저 ${socket.data.sub}님이 캘린더 방 ${socket.data.calendarId}에서 나갔습니다.`
      );
    });

    socket.on('disconnect', () => {
      this.handleLeave(socket);
      console.log(`유저 ${socket.data.sub}님이 연결을 종료했습니다.`);
    });

    socket.on('error', (err: Error) => {
      console.error(`소켓 에러 발생: ${err.message}`);
    });
  }

  private async joinCalendarRoom(socket: CustomSocket) {
    const { calendarId, nickname, sub, role } = socket.data;

    if (socket.rooms.has(calendarId)) {
      return;
    }

    socket.join(calendarId);

    console.log(`아이디: ${sub}가 캘린더 방: ${calendarId} 입장`);

    socket.to(calendarId).emit('userOnline', {
      sub,
      nickname,
      role,
    });

    const sockets = await socket.in(calendarId).fetchSockets();

    const onlineUsers = sockets.map((s) => {
      const data = (s as unknown as CustomSocket).data;
      return {
        sub: data.sub,
        nickname: data.nickname,
        role: data.role,
      };
    });

    onlineUsers.push({ sub, nickname, role });

    socket.emit('onlineUsers', onlineUsers);
  }

  private handleLeave(socket: CustomSocket) {
    const { calendarId, nickname, sub } = socket.data;

    if (calendarId) {
      socket.leave(calendarId);

      socket.to(calendarId).emit('userOffline', {
        sub,
        nickname,
      });

      console.log(`아이디: ${sub}가 캘린더 방: ${calendarId} 퇴장`);
    }
  }
}
