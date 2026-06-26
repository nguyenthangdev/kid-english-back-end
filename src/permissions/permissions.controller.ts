import { Controller, Get, Post, Body } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { SaveMatrixDto } from './dto/save-matrix.dto';

@Controller('admin/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Post('matrix')
  saveMatrix(@Body() dto: SaveMatrixDto) {
    return this.permissionsService.saveMatrix(dto.matrix);
  }
}
