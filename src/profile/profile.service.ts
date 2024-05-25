import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { Repository } from 'typeorm';
import { ProfileType } from './types/profile.type';
import { ProfileResponseInterface } from './types/profileResponse.interface';
import { FollowEntity } from '../article/follow.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async getProfile(
    currentUserId: number,
    profileUserName: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOneBy({
      username: profileUserName,
    });

    if (!user) {
      throw new HttpException('Profile does not exist', HttpStatus.NOT_FOUND);
    }

    const isFollowing = await this.followRepository.findOneBy({
      followerId: currentUserId,
      followingId: user.id,
    });

    return { ...user, following: Boolean(isFollowing) };
  }

  async followProfile(
    currentUserId: number,
    profileUserName: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOneBy({
      username: profileUserName,
    });

    if (!user) {
      throw new HttpException('Profile does not exist', HttpStatus.NOT_FOUND);
    }

    if (currentUserId === user.id) {
      throw new HttpException(
        'Follower and following should not be equal',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isFollowed = await this.followRepository.findOneBy({
      followerId: currentUserId,
      followingId: user.id,
    });

    if (!isFollowed) {
      const follow = new FollowEntity();

      follow.followerId = currentUserId;
      follow.followingId = user.id;

      await this.followRepository.save(follow);
    }

    return { ...user, following: true };
  }

  async unfollowProfile(
    currentUserId: number,
    profileUserName: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOneBy({
      username: profileUserName,
    });

    if (!user) {
      throw new HttpException('Profile does not exist', HttpStatus.NOT_FOUND);
    }

    if (user.id === currentUserId) {
      throw new HttpException(
        'Follower and following profiles should not be equal',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.followRepository.delete({
      followerId: currentUserId,
      followingId: user.id,
    });

    return { ...user, following: false };
  }

  async buildProfileResponse(
    profile: ProfileType,
  ): Promise<ProfileResponseInterface> {
    delete profile.email;
    return { profile };
  }
}
