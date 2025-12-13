import pool from '../config/database';
import { VoteController } from '../controllers/vote.controller';
import { DateOptionRepository, IDateOptionRepository } from '../repositories/dateOption.repository';
import { IVoteRepository, VoteRepository } from '../repositories/vote.repository';
import { IVoteService, VoteService } from '../services/vote.service';
import { calendarService } from './calendar.container';
import { participantService } from './participant.container';

const db = pool;

// Repositories
const dateOptionRepository: IDateOptionRepository = new DateOptionRepository(db);
const voteRepository: IVoteRepository = new VoteRepository(db);

// Services
const voteService: IVoteService = new VoteService(voteRepository, dateOptionRepository);

// Controllers
export const voteController = new VoteController(voteService, calendarService, participantService);
