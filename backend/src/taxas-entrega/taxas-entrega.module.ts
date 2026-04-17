import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TaxasEntregaController } from './taxas-entrega.controller';
import { TaxasEntregaService } from './taxas-entrega.service';

@Module({
  imports: [PrismaModule],
  controllers: [TaxasEntregaController],
  providers: [TaxasEntregaService],
})
export class TaxasEntregaModule {}
