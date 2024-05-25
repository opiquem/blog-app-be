import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express'; // Import ExpressAdapter
import * as express from 'express'; // Import Express

async function bootstrap() {
  const server = express(); // Create an Express server

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server)); // Use the Express server as a base

  // Configure CORS options
  app.enableCors({
    origin: '*', // You should set this to a specific origin in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Set to true if you need to allow credentials (e.g., cookies)
  });

  const config = new DocumentBuilder()
      .setTitle('Nest-App')
      .setDescription('The Nest-App API documentation')
      .setVersion('1.0')
      .addTag('nest-app')
      .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(4000);
}
bootstrap();
