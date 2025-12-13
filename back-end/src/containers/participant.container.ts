import pool from '../config/database';
import { ParticipantController } from '../controllers/participant.controller';
import {
  IParticipantRepository,
  ParticipantRepository,
} from '../repositories/participant.repository';
import { IParticipantService, ParticipantService } from '../services/participant.service';
import { tokenService, userService } from './auth.container';
import { calendarService } from './calendar.container';

const db = pool;

// Repositories
export const participantRepository: IParticipantRepository = new ParticipantRepository(db);

export const participantService: IParticipantService = new ParticipantService(
  participantRepository
);

// Controllers
export const participantController = new ParticipantController(
  participantService,
  calendarService,
  userService,
  tokenService
);
