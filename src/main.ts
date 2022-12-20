import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './utils/swagger/swagger';

// swagger 설정 및 main
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  setupSwagger(app);
  app.use(cookieParser());
  app.useGlobalPipes(
    // 들어오는 요청에 대해 파이프라인을 사용하여 validation 검사를 수행한다.
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors();
  await app.listen(3333);
}
bootstrap();
