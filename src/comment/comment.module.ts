import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './comment.entity';
import { ArticleEntity } from '../article/article.entity';
import { UserEntity } from '../user/user.entity';
import { CommentsService } from './comment.service';
import { CommentsController } from './comment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity, ArticleEntity, UserEntity]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentModule {}
