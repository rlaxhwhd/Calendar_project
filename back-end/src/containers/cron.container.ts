import { CronService } from '../services/cron.service';
import { calendarRepository } from './calendar.container';

export const cronService = new CronService(calendarRepository);
