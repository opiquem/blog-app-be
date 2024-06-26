import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  readonly body: string;

  @IsNotEmpty()
  readonly articleId: number;
}
