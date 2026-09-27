import { DataSource, SelectQueryBuilder } from 'typeorm';
import { PreguntaRevisionSolicitada } from '../../../../application/model/pregunta-revision-solicitada';
import { PreguntaRevisionSolicitadaInconsistenteException } from '../../../../application/exception/pregunta-revision-solicitada-inconsistente.exception';
import { PreguntaRevisionSolicitadaStore } from '../../../../application/port/out/pregunta-revision-solicitada.store';
import { RevisionOrmEntity } from '../revision/revision.orm-entity';
import { PreguntaRevisionSolicitadaOrmEntity } from './pregunta-revision-solicitada.orm-entity';

export class TypeOrmPreguntaRevisionSolicitadaStoreAdapter extends PreguntaRevisionSolicitadaStore {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async register(solicitud: PreguntaRevisionSolicitada): Promise<void> {
    const repository = this.dataSource.getRepository(PreguntaRevisionSolicitadaOrmEntity);

    await repository
      .createQueryBuilder()
      .insert()
      .into(PreguntaRevisionSolicitadaOrmEntity)
      .values({
        preguntaId: solicitud.preguntaId,
        versionPregunta: solicitud.versionPregunta,
        autorId: solicitud.autorId,
      })
      .orIgnore()
      .execute();

    const filaEfectiva = await repository.findOne({
      where: {
        preguntaId: solicitud.preguntaId,
        versionPregunta: solicitud.versionPregunta,
      },
    });

    if (filaEfectiva !== null && filaEfectiva.autorId !== solicitud.autorId) {
      throw new PreguntaRevisionSolicitadaInconsistenteException(
        solicitud.preguntaId,
        solicitud.versionPregunta,
        filaEfectiva.autorId,
        solicitud.autorId,
      );
    }
  }

  async findPendingByPreguntaId(preguntaId: string): Promise<PreguntaRevisionSolicitada | null> {
    const fila = await this.consultaPendientes().andWhere('solicitud.preguntaId = :preguntaId', { preguntaId }).getOne();

    return fila === null ? null : this.aModelo(fila);
  }

  async listPending(): Promise<readonly PreguntaRevisionSolicitada[]> {
    const filas = await this.consultaPendientes().getMany();
    return filas.map((fila) => this.aModelo(fila));
  }

  private consultaPendientes(): SelectQueryBuilder<PreguntaRevisionSolicitadaOrmEntity> {
    return this.dataSource
      .getRepository(PreguntaRevisionSolicitadaOrmEntity)
      .createQueryBuilder('solicitud')
      .leftJoin(
        RevisionOrmEntity,
        'revision',
        'revision.preguntaId = solicitud.preguntaId AND revision.versionPregunta = solicitud.versionPregunta',
      )
      .where('revision.revisionId IS NULL');
  }

  private aModelo(fila: PreguntaRevisionSolicitadaOrmEntity): PreguntaRevisionSolicitada {
    return {
      preguntaId: fila.preguntaId,
      versionPregunta: fila.versionPregunta,
      autorId: fila.autorId,
    };
  }
}
