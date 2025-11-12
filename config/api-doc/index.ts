import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export default class SwaggerConfig {
  async set(app: INestApplication) {
    const options = new DocumentBuilder()
      .setTitle('Volt Fleet App Backend')
      .setDescription(
        'VoltFleet is a NestJS-based IoT telemetry platform for electric vehicles, enabling real-time data ingestion, analytics, and fleet monitoring. It supports live tracking, battery insights, predictive maintenance, and alerts using Redis, PostgreSQL, MQTT, and WebSockets for scalable EV fleet management.',
      )
      .setVersion('1.0.0')
      .addTag('Volt Fleet App Backend')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'authorization',
          description: 'Enter JWT token',
          in: 'header',
        },
        'token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api-docs', app, document);
  }
}
