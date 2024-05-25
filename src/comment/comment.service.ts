import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleEntity } from '../article/article.entity';
import { UserEntity } from '../user/user.entity';
import { CommentEntity } from './comment.entity';
import { CreateCommentDto } from './dto/createCommentDto';
import { UpdateCommentDto } from './dto/updateCommentDto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
    userId: number,
  ): Promise<CommentEntity> {
    const { body, articleId } = createCommentDto;

    const author = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const comment = this.commentRepository.create({ body, author, article });
    return this.commentRepository.save(comment);
  }

  async findAll(): Promise<CommentEntity[]> {
    return this.commentRepository.find();
  }

  async findOne(id: number): Promise<CommentEntity> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async update(
    id: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentEntity> {
    const comment = await this.findOne(id);
    const updatedComment = Object.assign(comment, updateCommentDto);
    return this.commentRepository.save(updatedComment);
  }

  async remove(id: number): Promise<void> {
    const comment = await this.findOne(id);
    await this.commentRepository.remove(comment);
  }
}
