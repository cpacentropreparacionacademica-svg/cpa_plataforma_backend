import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ResourceModuleName } from '../../common/decorators/resource-module.decorator';
import { CrudService } from '../shared-crud/crud.service';
import { PersonasLifecycleService } from './personas-lifecycle.service';

@ApiTags('personas')
@ApiCookieAuth()
@ResourceModuleName('personas')
@Controller('personas')
export class PersonasController {
  constructor(
    private readonly crud: CrudService,
    private readonly lifecycle: PersonasLifecycleService,
  ) {}


  @Post('estudiante/registrar')
  registrarEstudiante(@Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.lifecycle.registrarEstudiante(body, request.user?.idPersona);
  }

  @Post('tutor/registrar')
  registrarTutor(@Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.lifecycle.registrarTutor(body, request.user?.idPersona);
  }

  @Post('usuario/registrar')
  registrarUsuario(@Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.lifecycle.registrarUsuario(body, request.user?.idPersona);
  }

  @Post(':resourcePath/batch/validate')
  @UseInterceptors(AnyFilesInterceptor())
  validateBatchImport(
    @Param('resourcePath') resourcePath: string,
    @UploadedFiles() files: Array<{ buffer: Buffer; originalname?: string; mimetype?: string; size?: number }> | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.crud.validateImportBatch('personas', resourcePath, { body, files });
  }

  @Post(':resourcePath/batch/process')
  @UseInterceptors(AnyFilesInterceptor())
  processBatchImport(
    @Param('resourcePath') resourcePath: string,
    @UploadedFiles() files: Array<{ buffer: Buffer; originalname?: string; mimetype?: string; size?: number }> | undefined,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.processImportBatch('personas', resourcePath, { body, files }, request.user?.idPersona);
  }

  @Post(':resourcePath/batch')
  createBatch(
    @Param('resourcePath') resourcePath: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.crud.createBatch('personas', resourcePath, body, request.user?.idPersona);
  }

  @Put(':resourcePath/batch')
  updateBatch(
    @Param('resourcePath') resourcePath: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.crud.updateBatch('personas', resourcePath, body, request.user?.idPersona);
  }

  @Patch(':resourcePath/batch')
  patchBatch(
    @Param('resourcePath') resourcePath: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.crud.updateBatch('personas', resourcePath, body, request.user?.idPersona);
  }

  @Post(':resourcePath')
  create(
    @Param('resourcePath') resourcePath: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.create('personas', resourcePath, body, request.user?.idPersona);
  }

  @Get(':resourcePath')
  list(@Param('resourcePath') resourcePath: string, @Query() query: Record<string, unknown>) {
    return this.crud.list('personas', resourcePath, query);
  }

  @Get(':resourcePath/:id')
  get(@Param('resourcePath') resourcePath: string, @Param('id') id: string) {
    return this.crud.get('personas', resourcePath, [id]);
  }

  @Get(':resourcePath/:id1/:id2')
  getComposite(@Param('resourcePath') resourcePath: string, @Param('id1') id1: string, @Param('id2') id2: string) {
    return this.crud.get('personas', resourcePath, [id1, id2]);
  }

  @Put(':resourcePath/:id')
  update(
    @Param('resourcePath') resourcePath: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('personas', resourcePath, [id], body, request.user?.idPersona);
  }

  @Put(':resourcePath/:id1/:id2')
  updateComposite(
    @Param('resourcePath') resourcePath: string,
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('personas', resourcePath, [id1, id2], body, request.user?.idPersona);
  }

  @Patch(':resourcePath/:id')
  patch(
    @Param('resourcePath') resourcePath: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('personas', resourcePath, [id], body, request.user?.idPersona);
  }

  @Patch(':resourcePath/:id1/:id2')
  patchComposite(
    @Param('resourcePath') resourcePath: string,
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('personas', resourcePath, [id1, id2], body, request.user?.idPersona);
  }
}
