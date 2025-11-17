import { UserRepository } from '../../../repositories';

describe('userRepository 테스트', () => {
  let userRepository: UserRepository;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
    userRepository = new UserRepository(mockPool);
  });

  it('', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const provider = 'google';
    const oauthId = 'some-id';

    await userRepository.findByOauthId(provider, oauthId);

    const expectedSql =
      'SELECT user_uuid, email, oauth_provider, nickname, profile_image_url  FROM users WHERE oauth_provider = ? AND oauth_id = ?';
    const expectedParams = [provider, oauthId];

    expect(mockPool.query).toHaveBeenCalledWith(expectedSql, expectedParams);
  });
});
