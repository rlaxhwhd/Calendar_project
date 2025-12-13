import { IUserRepository } from '../types/user.types';

export interface IUserService {
  getIdUsingUuid(userUuid: string): Promise<number>;
}

export class UserService implements IUserService {
  constructor(private userRepoitory: IUserRepository) {}
  async getIdUsingUuid(userUuid: string): Promise<number> {
    return this.userRepoitory.getIdUsingUuid(userUuid);
  }
}
