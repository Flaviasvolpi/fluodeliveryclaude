import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SnakeToCamelInterceptor } from './common/interceptors/snake-to-camel.interceptor';
import { CamelToSnakeInterceptor } from './common/interceptors/camel-to-snake.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // Request: snake_case → camelCase (frontend sends snake, Prisma needs camel)
  // Response: camelCase → snake_case (Prisma returns camel, frontend expects snake)
  app.useGlobalInterceptors(
    new SnakeToCamelInterceptor(),
    new CamelToSnakeInterceptor(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`FluoDelivery API running on port ${port}`);
}
bootstrap();
