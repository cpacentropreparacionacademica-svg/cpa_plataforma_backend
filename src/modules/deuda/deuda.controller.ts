import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ResourceModuleName } from '../../common/decorators/resource-module.decorator';
import { CrudService } from '../shared-crud/crud.service';

@ApiTags('deuda')
@ApiCookieAuth()
@ResourceModuleName('deuda')
@Controller('deuda')
export class DeudaController {
  constructor(private readonly crud: CrudService) {}


  @Post(':resourcePath/batch')
  createBatch(
    @Param('resourcePath') resourcePath: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.crud.createBatch('deuda', resourcePath, body, request.user?.idPersona);
  }

  @Put(':resourcePath/batch')
  updateBatch(
    @Param('resourcePath') resourcePath: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.crud.updateBatch('deuda', resourcePath, body, request.user?.idPersona);
  }

  @Patch(':resourcePath/batch')
  patchBatch(
    @Param('resourcePath') resourcePath: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.crud.updateBatch('deuda', resourcePath, body, request.user?.idPersona);
  }

  @Post(':resourcePath')
  create(
    @Param('resourcePath') resourcePath: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.create('deuda', resourcePath, body, request.user?.idPersona);
  }

  @Get(':resourcePath')
  list(@Param('resourcePath') resourcePath: string, @Query() query: Record<string, unknown>) {
    return this.crud.list('deuda', resourcePath, query);
  }

  @Get(':resourcePath/:id')
  get(@Param('resourcePath') resourcePath: string, @Param('id') id: string) {
    return this.crud.get('deuda', resourcePath, [id]);
  }

  @Get(':resourcePath/:id1/:id2')
  getComposite(@Param('resourcePath') resourcePath: string, @Param('id1') id1: string, @Param('id2') id2: string) {
    return this.crud.get('deuda', resourcePath, [id1, id2]);
  }

  @Put(':resourcePath/:id')
  update(
    @Param('resourcePath') resourcePath: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('deuda', resourcePath, [id], body, request.user?.idPersona);
  }

  @Put(':resourcePath/:id1/:id2')
  updateComposite(
    @Param('resourcePath') resourcePath: string,
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('deuda', resourcePath, [id1, id2], body, request.user?.idPersona);
  }

  @Patch(':resourcePath/:id')
  patch(
    @Param('resourcePath') resourcePath: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('deuda', resourcePath, [id], body, request.user?.idPersona);
  }

  @Patch(':resourcePath/:id1/:id2')
  patchComposite(
    @Param('resourcePath') resourcePath: string,
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('deuda', resourcePath, [id1, id2], body, request.user?.idPersona);
  }
}
