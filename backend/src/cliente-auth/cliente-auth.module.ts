import { Module } from '@nestjs/common';
import { ClienteAuthController } from './cliente-auth.controller';
import { ClienteAuthService } from './cliente-auth.service';

@Module({
  controllers: [ClienteAuthController],
  providers: [ClienteAuthService],
})
export class ClienteAuthModule {}
