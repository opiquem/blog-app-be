import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { DeleteResult, Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { ArticleEntity } from './article.entity';
import { CreateArticleDto } from './dto/createArticle.dto';
import { UpdateArticleDto } from './dto/updateArticle.dto';
import { FollowEntity } from './follow.entity';
import { ArticleType } from './types/article.type';
import { ArticleResponseInterface } from './types/articleResponse.interface';
import { ArticlesResponseInterface } from './types/articlesResponseInterface';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async findAll(
    currentUserId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const articlesCount = await this.articleRepository
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .getCount();

    let articlesFromServer = this.articleRepository
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .orderBy('articles.createdAt', 'DESC');

    if (query.tag) {
      articlesFromServer.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    if (query.title) {
      articlesFromServer.andWhere('articles.title LIKE :title', {
        title: `%${query.title}%`,
      });
    }

    if (query.author) {
      const author = await this.userRepository.findOneBy({
        username: query.author,
      });
      if (!author) {
        throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
      }

      articlesFromServer.andWhere('articles.authorId = :id', {
        id: author.id,
      });
    }

    if (query.favorited) {
      const author = await this.userRepository.findOne({
        where: {
          username: query.favorited,
        },
        relations: ['favorites'],
      });
      const ids = author.favorites.map((el) => el.id);

      if (ids.length > 0) {
        articlesFromServer.andWhere('articles.id IN (:...ids)', { ids });
      } else {
        articlesFromServer.andWhere('1337=228');
      }
    }

    if (query.limit) {
      articlesFromServer = articlesFromServer.limit(+query.limit);
    }

    if (query.offset) {
      articlesFromServer = articlesFromServer.offset(+query.offset);
    }

    let favoritedArticles: number[] = [];

    if (currentUserId) {
      const currentUser = await this.userRepository.findOne({
        where: {
          id: currentUserId,
        },
        relations: ['favorites'],
      });
      favoritedArticles = currentUser.favorites.map((article) => article.id);
    }

    const preparedArticles = await articlesFromServer.getMany();

    const articles: ArticleType[] = preparedArticles.map((article) => {
      const favorited = favoritedArticles.includes(article.id);

      return { ...article, favorited };
    });

    return { articlesCount, articles };
  }

  async getFeed(
    currentUserId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const follows = await this.followRepository.find({
      where: {
        followerId: currentUserId,
      },
    });

    if (follows.length === 0) {
      return { articlesCount: 0, articles: [] };
    }

    const followedUserIds = follows.map((followed) => followed.followingId);

    let articlesFromServer = this.articleRepository
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .where('articles.authorId IN (:...ids)', { ids: followedUserIds })
      .orderBy('articles.createdAt', 'DESC');

    const articlesCount = await articlesFromServer.getCount();

    if (query.limit) {
      articlesFromServer = articlesFromServer.limit(+query.limit);
    }

    if (query.offset) {
      articlesFromServer = articlesFromServer.offset(+query.offset);
    }

    const articles = await articlesFromServer.getMany();

    return { articlesCount, articles };
  }

  async createArticle(
    currentUser: UserEntity,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const newArticle = new ArticleEntity();
    Object.assign(newArticle, createArticleDto);

    if (!newArticle.tagList) {
      newArticle.tagList = [];
    }
    newArticle.author = currentUser;
    newArticle.slug = this.generateSlug(createArticleDto.title);

    return this.articleRepository.save(newArticle);
  }

  async findArticleBySlug(slug: string) {
    const foundArticle = this.articleRepository.findOneBy({ slug });
    return await foundArticle;
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private generateSlug(title: string): string {
    return (
      ((Math.random() * Math.pow(18, 6)) | 0).toString(36) +
      '-' +
      slugify(title, { lower: true })
    );
  }

  async deleteArticle(
    slug: string,
    currentUserId: number,
  ): Promise<DeleteResult> {
    const article = await this.findArticleBySlug(slug);

    if (!article) {
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
    }

    if (article.author.id !== currentUserId) {
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN);
    }

    return this.articleRepository.delete({ slug });
  }

  async updateArticle(
    slug: string,
    currentUserId: number,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleEntity> {
    const article = await this.findArticleBySlug(slug);
    if (!article) {
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
    }

    if (article.author.id !== currentUserId) {
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN);
    }

    Object.assign(article, updateArticleDto);
    article.slug = this.generateSlug(article.title);

    return await this.articleRepository.save(article);
  }

  async addArticleToFavorites(
    slug: string,
    currentUserId,
  ): Promise<ArticleEntity> {
    const article = await this.findArticleBySlug(slug);

    if (!article) {
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
    }

    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['favorites'],
    });

    const isNotFavorited =
      user.favorites.findIndex(
        (articleInFavorites) => articleInFavorites.id === article.id,
      ) === -1;

    if (isNotFavorited) {
      user.favorites.push(article);
      article.favoritesCount++;

      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async deleteArticleFromFavorites(
    slug: string,
    currentUserId,
  ): Promise<ArticleEntity> {
    const article = await this.findArticleBySlug(slug);

    if (!article) {
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
    }

    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['favorites'],
    });

    const favoritedArticleIndex = user.favorites.findIndex(
      (articleInFavorites) => articleInFavorites.id === article.id,
    );

    if (favoritedArticleIndex !== -1) {
      user.favorites.splice(favoritedArticleIndex, 1);
      article.favoritesCount--;

      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }
}
