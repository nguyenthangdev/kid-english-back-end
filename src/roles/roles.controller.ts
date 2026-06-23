import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List all active roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role (Admin only)' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role (Admin only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a role (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.softDelete(id);
  }
}
