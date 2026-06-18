import { Module, forwardRef } from '@nestjs/common';
import { BracketsController } from './brackets.controller';
import { BracketsService } from './brackets.service';
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [forwardRef(() => GatewaysModule)],
  controllers: [BracketsController],
  providers: [BracketsService],
  exports: [BracketsService],
})
export class BracketsModule {}
