import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ResourceModuleName } from '../../common/decorators/resource-module.decorator';
import { CrudService } from '../shared-crud/crud.service';

@ApiTags('administracion')
@ApiCookieAuth()
@ResourceModuleName('administracion')
@Controller('administracion')
export class AdministracionController {
  constructor(private readonly crud: CrudService) {}

  @Post(':resourcePath')
  create(
    @Param('resourcePath') resourcePath: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.create('administracion', resourcePath, body, request.user?.idPersona);
  }

  @Get(':resourcePath')
  list(@Param('resourcePath') resourcePath: string, @Query() query: Record<string, unknown>) {
    return this.crud.list('administracion', resourcePath, query);
  }

  @Get(':resourcePath/:id')
  get(@Param('resourcePath') resourcePath: string, @Param('id') id: string) {
    return this.crud.get('administracion', resourcePath, [id]);
  }

  @Get(':resourcePath/:id1/:id2')
  getComposite(@Param('resourcePath') resourcePath: string, @Param('id1') id1: string, @Param('id2') id2: string) {
    return this.crud.get('administracion', resourcePath, [id1, id2]);
  }

  @Put(':resourcePath/:id')
  update(
    @Param('resourcePath') resourcePath: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('administracion', resourcePath, [id], body, request.user?.idPersona);
  }

  @Put(':resourcePath/:id1/:id2')
  updateComposite(
    @Param('resourcePath') resourcePath: string,
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('administracion', resourcePath, [id1, id2], body, request.user?.idPersona);
  }

  @Patch(':resourcePath/:id')
  patch(
    @Param('resourcePath') resourcePath: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('administracion', resourcePath, [id], body, request.user?.idPersona);
  }

  @Patch(':resourcePath/:id1/:id2')
  patchComposite(
    @Param('resourcePath') resourcePath: string,
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('administracion', resourcePath, [id1, id2], body, request.user?.idPersona);
  }
}
