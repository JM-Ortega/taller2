import { Channel } from 'amqplib';
import { DataSource, IsNull } from 'typeorm';
import { OutboxEventOrmEntity } from '../../persistence/typeorm/outbox/outbox-event.orm-entity';

const EVENT_TYPE = 'RevisionFinalizada';
const EXCHANGE = 'saberpro.events';
const ROUTING_KEY = 'revision.finalizada';

export class RevisionFinalizadaOutboxDispatcher {
  constructor(
    private readonly dataSource: DataSource,
    private readonly channel: Channel,
  ) {}

  async dispatchPending(): Promise<void> {
    const repository = this.dataSource.getRepository(OutboxEventOrmEntity);

    const pendientes = await repository.find({
      where: { eventType: EVENT_TYPE, publishedAt: IsNull() },
      order: { occurredAt: 'ASC' },
    });

    for (const evento of pendientes) {
      const body = Buffer.from(JSON.stringify(evento.payload), 'utf-8');
      this.channel.publish(EXCHANGE, ROUTING_KEY, body, {
        contentType: 'application/json',
        contentEncoding: 'utf-8',
      });

      // publishedAt se marca solo tras el publish local: un fallo posterior al
      // guardar la marca deja el evento elegible para redelivery/duplicado, y
      // el consumidor debe tolerarlo idempotentemente.
      evento.publishedAt = new Date();
      await repository.save(evento);
    }
  }
}
