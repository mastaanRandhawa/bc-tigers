import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('contact')
export class ContactController {
  constructor(private service: ContactService) {}

  @Post()
  submit(
    @Body()
    body: { name: string; email: string; subject: string; message: string },
  ) {
    return this.service.create(body);
  }

  @Get()
  @AdminOnly()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id/read')
  @AdminOnly()
  markRead(@Param('id') id: string) {
    return this.service.markRead(id);
  }
}
