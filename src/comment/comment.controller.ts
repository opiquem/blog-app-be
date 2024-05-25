import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { User } from 'src/user/decorators/user.decorator';
import { AuthGuard } from 'src/user/guards/auth.guard';
import { CommentEntity } from './comment.entity';
import { CommentsService } from './comment.service';
import { CreateCommentDto } from './dto/createCommentDto';
import { UpdateCommentDto } from './dto/updateCommentDto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(
    @User('id') currentUserId: number,
    @Body('comment') createCommentDto: CreateCommentDto,
  ): Promise<CommentEntity> {
    return this.commentsService.create(createCommentDto, currentUserId);
  }

  @Get()
  findAll(): Promise<CommentEntity[]> {
    return this.commentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<CommentEntity> {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body('comment') updateCommentDto: UpdateCommentDto,
  ): Promise<CommentEntity> {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.commentsService.remove(id);
  }
}
