import pool from '../config/database';
import { CalendarController } from '../controllers/calendar.controller';
import { CalendarRepository, ICalendarRepository } from '../repositories/calendar.repository';
import { CalendarService, ICalendarService } from '../services/calendar.service';
import { tokenService, userService } from './auth.container';
import { participantRepository, participantService } from './participant.container';

const db = pool;

export const calendarRepository: ICalendarRepository = new CalendarRepository(db);

export const calendarService: ICalendarService = new CalendarService(
  calendarRepository,
  participantRepository
);
export const calendarController = new CalendarController(
  calendarService,
  userService,
  participantService,
  tokenService
);
