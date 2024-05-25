import { ArticleType } from './article.type';

export interface ArticlesResponseInterface {
  articlesCount: number;
  articles: ArticleType[];
}
