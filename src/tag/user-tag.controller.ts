import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtUserAuthGuard } from '../common/guards/jwt-user-auth.guard';
import { TagService } from './tag.service';
import { TagQueryDto } from './dto/tag-query.dto';

@ApiTags('Tags')
@ApiBearerAuth('access-token')
@UseGuards(JwtUserAuthGuard)
@Controller('tags')
export class UserTagController {
  constructor(private readonly tagsService: TagService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get tags for user side filter' })
  getTags(@Query() queryDto: TagQueryDto) {
    return this.tagsService.getTags(queryDto);
  }
}
