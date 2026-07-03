import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

type ArchivoPayload = Record<string, unknown>;

type RegistrarArchivoTransaccionPayload = Record<string, unknown> & {
  archivo?: ArchivoPayload;
};

@Injectable()
export class ContabilidadArchivoService {
  constructor(private readonly dataSource: DataSource) {}

  async registrarArchivo(payload: ArchivoPayload, authUserId?: string) {
    const data = await this.dataSource.transaction(async (manager) => this.insertArchivo(manager, payload, authUserId));
    return { success: true, message: 'Archivo creado correctamente.', data };
  }

  async registrarArchivoTransaccion(payload: RegistrarArchivoTransaccionPayload, authUserId?: string) {
    const idTransaccion = this.toPositiveInt(payload.id_transaccion, 'id_transaccion');
    const tipoAsociacion = this.toOptionalText(payload.tipo_asociacion) || 'SOPORTE';

    const data = await this.dataSource.transaction(async (manager) => {
      await this.assertTransaccionExists(manager, idTransaccion);

      const idArchivoExistente = this.toOptionalPositiveInt(payload.id_archivo);
      const archivo = idArchivoExistente
        ? await this.getArchivo(manager, idArchivoExistente)
        : await this.insertArchivo(manager, this.extractArchivoPayload(payload), authUserId);

      const idArchivo = this.toPositiveInt(archivo.id_archivo, 'id_archivo');
      const asociacion = await this.insertArchivoTransaccion(manager, {
        idArchivo,
        idTransaccion,
        tipoAsociacion,
        observacion: this.toOptionalText(payload.observacion),
        metadataJson: this.normalizeJson(payload.metadata_json),
      }, authUserId);

      return { archivo, archivoTransaccion: asociacion };
    });

    return {
      success: true,
      message: 'Archivo y asociación a transacción creados correctamente.',
      data,
    };
  }

  private async insertArchivo(manager: EntityManager, payload: ArchivoPayload, authUserId?: string): Promise<Record<string, unknown>> {
    const urlArchivo = this.toOptionalText(payload.url_archivo ?? payload.link_archivo ?? payload.link_achivo ?? payload.url);
    if (!urlArchivo) {
      throw new BadRequestException('url_archivo o link_archivo es obligatorio para crear un archivo.');
    }

    const metadataJson = this.normalizeJson(payload.metadata_json ?? payload.metadata);
    const rows = await manager.query(
      `INSERT INTO contabilidad.archivo (
         nombre_archivo, descripcion, url_archivo, tipo_mime, tamano_bytes,
         storage_provider, storage_key, checksum_sha256, metadata_json,
         id_usuario_creador
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)
       RETURNING *`,
      [
        this.toOptionalText(payload.nombre_archivo ?? payload.nombre ?? payload.filename),
        this.toOptionalText(payload.descripcion),
        urlArchivo,
        this.toOptionalText(payload.tipo_mime ?? payload.mime_type ?? payload.mimetype),
        this.toOptionalPositiveInt(payload.tamano_bytes ?? payload.size_bytes ?? payload.size),
        this.toOptionalText(payload.storage_provider ?? payload.provider),
        this.toOptionalText(payload.storage_key ?? payload.key),
        this.toOptionalText(payload.checksum_sha256 ?? payload.sha256),
        JSON.stringify(metadataJson),
        authUserId ? Number(authUserId) : null,
      ],
    ) as Record<string, unknown>[];

    return rows[0];
  }

  private async insertArchivoTransaccion(
    manager: EntityManager,
    input: { idArchivo: number; idTransaccion: number; tipoAsociacion: string; observacion?: string; metadataJson: Record<string, unknown> },
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    try {
      const rows = await manager.query(
        `INSERT INTO contabilidad.archivo_transaccion (
           id_archivo, id_transaccion, tipo_asociacion, observacion, metadata_json, id_usuario_creador
         ) VALUES ($1,$2,$3,$4,$5::jsonb,$6)
         RETURNING *`,
        [
          input.idArchivo,
          input.idTransaccion,
          input.tipoAsociacion,
          input.observacion || null,
          JSON.stringify(input.metadataJson || {}),
          authUserId ? Number(authUserId) : null,
        ],
      ) as Record<string, unknown>[];

      return rows[0];
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === '23505') {
        throw new BadRequestException('El archivo ya está asociado a esa transacción con el mismo tipo_asociacion.');
      }
      throw error;
    }
  }

  private extractArchivoPayload(payload: RegistrarArchivoTransaccionPayload): ArchivoPayload {
    if (payload.archivo && typeof payload.archivo === 'object' && !Array.isArray(payload.archivo)) {
      return payload.archivo;
    }
    return payload;
  }

  private async assertTransaccionExists(manager: EntityManager, idTransaccion: number): Promise<void> {
    const rows = await manager.query(
      `SELECT id_transaccion FROM contabilidad.transaccion WHERE id_transaccion = $1 LIMIT 1`,
      [idTransaccion],
    ) as Array<{ id_transaccion: unknown }>;
    if (!rows[0]) throw new NotFoundException(`No existe la transacción ${idTransaccion}.`);
  }

  private async getArchivo(manager: EntityManager, idArchivo: number): Promise<Record<string, unknown>> {
    const rows = await manager.query(
      `SELECT * FROM contabilidad.archivo WHERE id_archivo = $1 LIMIT 1`,
      [idArchivo],
    ) as Record<string, unknown>[];
    if (!rows[0]) throw new NotFoundException(`No existe el archivo ${idArchivo}.`);
    return rows[0];
  }

  private normalizeJson(value: unknown): Record<string, unknown> {
    if (value === undefined || value === null || value === '') return {};
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
      } catch {
        throw new BadRequestException('metadata_json debe ser un objeto JSON válido.');
      }
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
    throw new BadRequestException('metadata_json debe ser un objeto JSON.');
  }

  private toOptionalText(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim();
    return text.length > 0 ? text : undefined;
  }

  private toOptionalPositiveInt(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric <= 0) return undefined;
    return numeric;
  }

  private toPositiveInt(value: unknown, field: string): number {
    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
    return numeric;
  }
}
