import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.NESTAPP_DB_HOST,
  port: +process.env.NESTAPP_DB_PORT,
  username: process.env.NESTAPP_DB_USERNAME,
  password: process.env.NESTAPP_DB_PASSWORD,
  database: process.env.NESTAPP_DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
  migrations: [__dirname + '/../**/seeds/*{.ts,.js}'],
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
