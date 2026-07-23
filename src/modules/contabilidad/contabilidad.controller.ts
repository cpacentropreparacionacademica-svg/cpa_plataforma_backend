import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ResourceModuleName } from '../../common/decorators/resource-module.decorator';
import { CrudService } from '../shared-crud/crud.service';
import { ContabilidadAccountingService } from './contabilidad-accounting.service';
import { ContabilidadArchivoService } from './contabilidad-archivo.service';

@ApiTags('contabilidad')
@ApiCookieAuth()
@ResourceModuleName('contabilidad')
@Controller('contabilidad')
export class ContabilidadController {
  constructor(
    private readonly crud: CrudService,
    private readonly accounting: ContabilidadAccountingService,
    private readonly archivoService: ContabilidadArchivoService,
  ) {}

  @Post('archivo/registrar')
  @RequirePermission('CONTABILIDAD.ARCHIVO.CREATE')
  registrarArchivo(@Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.archivoService.registrarArchivo(body, request.user?.idPersona);
  }

  @Post('archivo-transaccion/registrar')
  @RequirePermission('CONTABILIDAD.ARCHIVO_TRANSACCION.CREATE')
  registrarArchivoTransaccion(@Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.archivoService.registrarArchivoTransaccion(body, request.user?.idPersona);
  }

  @Post('venta-clase/registrar')
  @RequirePermission('CONTABILIDAD.VENTA_CLASE.REGISTRAR')
  registrarVentaClase(@Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.accounting.registrarVentaClase(body, request.user?.idPersona);
  }

  @Post('venta-clase/registrar-batch')
  @RequirePermission('CONTABILIDAD.VENTA_CLASE.REGISTRAR')
  registrarVentaClaseBatch(@Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.accounting.registrarVentaClaseBatch(body, request.user?.idPersona);
  }

  @Post(':resourcePath/con-movimientos')
  @RequirePermission('CONTABILIDAD.TRANSACCION.CON_MOVIMIENTOS')
  createTransaccionConMovimientos(
    @Param('resourcePath') resourcePath: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    this.assertTransaccionResource(resourcePath, 'con-movimientos');
    return this.accounting.crearTransaccionConMovimientos(body, request.user?.idPersona);
  }

  @Post(':resourcePath/:id/revert')
  @RequirePermission('CONTABILIDAD.TRANSACCION.REVERT')
  revertirAsiento(
    @Param('resourcePath') resourcePath: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    this.assertTransaccionResource(resourcePath, 'revert');
    return this.accounting.revertirAsiento(id, body, request.user?.idPersona);
  }

  /**
   * Estas rutas son exclusivas del asiento contable. Antes, cualquier otro
   * `resourcePath` caía silenciosamente en un create genérico, de modo que
   * `POST /api/contabilidad/cuenta/1/revert` creaba una cuenta en lugar de fallar.
   */
  private assertTransaccionResource(resourcePath: string, operation: string): void {
    if (resourcePath !== 'transaccion') {
      throw new BadRequestException(
        `La operación '${operation}' solo aplica a contabilidad/transaccion, no a '${resourcePath}'.`,
      );
    }
  }

  @Post(':resourcePath/batch/validate')
  @UseInterceptors(AnyFilesInterceptor())
  validateBatchImport(
    @Param('resourcePath') resourcePath: string,
    @UploadedFiles()
    files: Array<{ buffer: Buffer; originalname?: string; mimetype?: string; size?: number }> | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.crud.validateImportBatch('contabilidad', resourcePath, { body, files });
  }

  @Post(':resourcePath/batch/process')
  @UseInterceptors(AnyFilesInterceptor())
  processBatchImport(
    @Param('resourcePath') resourcePath: string,
    @UploadedFiles()
    files: Array<{ buffer: Buffer; originalname?: string; mimetype?: string; size?: number }> | undefined,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.processImportBatch('contabilidad', resourcePath, { body, files }, request.user?.idPersona);
  }

  @Post(':resourcePath/batch')
  createBatch(@Param('resourcePath') resourcePath: string, @Body() body: unknown, @Req() request: Request) {
    return this.crud.createBatch('contabilidad', resourcePath, body, request.user?.idPersona);
  }

  @Put(':resourcePath/batch')
  updateBatch(@Param('resourcePath') resourcePath: string, @Body() body: unknown, @Req() request: Request) {
    return this.crud.updateBatch('contabilidad', resourcePath, body, request.user?.idPersona);
  }

  @Patch(':resourcePath/batch')
  patchBatch(@Param('resourcePath') resourcePath: string, @Body() body: unknown, @Req() request: Request) {
    return this.crud.updateBatch('contabilidad', resourcePath, body, request.user?.idPersona);
  }

  @Post(':resourcePath')
  create(@Param('resourcePath') resourcePath: string, @Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.crud.create('contabilidad', resourcePath, body, request.user?.idPersona);
  }

  @Get(':resourcePath')
  list(@Param('resourcePath') resourcePath: string, @Query() query: Record<string, unknown>) {
    return this.crud.list('contabilidad', resourcePath, query);
  }

  @Get(':resourcePath/:id')
  get(@Param('resourcePath') resourcePath: string, @Param('id') id: string) {
    return this.crud.get('contabilidad', resourcePath, [id]);
  }

  @Get(':resourcePath/:id1/:id2')
  getComposite(@Param('resourcePath') resourcePath: string, @Param('id1') id1: string, @Param('id2') id2: string) {
    return this.crud.get('contabilidad', resourcePath, [id1, id2]);
  }

  @Put(':resourcePath/:id')
  update(
    @Param('resourcePath') resourcePath: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('contabilidad', resourcePath, [id], body, request.user?.idPersona);
  }

  @Put(':resourcePath/:id1/:id2')
  updateComposite(
    @Param('resourcePath') resourcePath: string,
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('contabilidad', resourcePath, [id1, id2], body, request.user?.idPersona);
  }

  @Patch(':resourcePath/:id')
  patch(
    @Param('resourcePath') resourcePath: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('contabilidad', resourcePath, [id], body, request.user?.idPersona);
  }

  @Patch(':resourcePath/:id1/:id2')
  patchComposite(
    @Param('resourcePath') resourcePath: string,
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.crud.update('contabilidad', resourcePath, [id1, id2], body, request.user?.idPersona);
  }
}
