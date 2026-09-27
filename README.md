# Taller 2 — Banco de Preguntas Saber Pro

Sistema para la gestión, validación y administración de un banco de preguntas para la preparación de las pruebas Saber Pro. Este repositorio implementa un subconjunto funcional del sistema: los Bounded Contexts Pregunta y Revisión, comunicados mediante REST, gRPC y RabbitMQ.

## Alcance

El repositorio implementa dos microservicios correspondientes a dos Bounded Contexts:

- **Pregunta**: identidad de la pregunta, autoría (`autorId` como referencia opaca), contexto, pregunta directa, cinco opciones, respuesta correcta, justificación, bibliografía, competencia, tema, subtema, nivel de dificultad, estado y versión enviada a revisión. El modelo reconoce los estados `BORRADOR`, `EN_CONSTRUCCION`, `PENDIENTE_REVISION`, `EN_REVISION`, `APROBADA`, `RECHAZADA`, `PUBLICADA` y `ARCHIVADA`. El flujo implementado en este Taller se concentra en el ciclo de creación, revisión, aprobación o rechazo y reapertura.
- **Revisión**: solicitudes locales de revisión, revisores asignados, evaluaciones individuales con criterios y observaciones, snapshot de la pregunta evaluada, resultado global e historial de revisiones.

## Arquitectura

```text
Cliente / Postman
        │
        ├── REST → pregunta-service
        └── REST → revision-service

pregunta-service
        │
        ├── PostgreSQL propio
        ├── servidor gRPC
        └── RabbitMQ productor/consumidor

revision-service
        │
        ├── PostgreSQL propio
        ├── cliente gRPC → pregunta-service
        └── RabbitMQ productor/consumidor
```

Ambos servicios tienen bases de datos independientes: no comparten tablas ni existen claves foráneas entre microservicios. La comunicación entre contextos combina dos vías:

- **Síncrona**: `revision-service` → gRPC → `pregunta-service`.
- **Asíncrona**: cada servicio publica sus eventos mediante Transactional Outbox hacia RabbitMQ, que los entrega al otro servicio.

### Microservicio Pregunta

Expone su API REST en `http://localhost:8080`, un servidor gRPC en el puerto `9090` y persiste en PostgreSQL. Produce el evento `PreguntaEnviadaARevision` y consume `RevisionFinalizada`.

### Microservicio Revisión

Expone su API REST en `http://localhost:3000`, actúa como cliente gRPC de `pregunta-service` y persiste en PostgreSQL. Consume `PreguntaEnviadaARevision` y produce `RevisionFinalizada`.

## Tecnologías

|                | Pregunta                    | Revisión      |
| -------------- | --------------------------- | ------------- |
| Lenguaje       | Java 21                     | TypeScript    |
| Framework      | Spring Boot 4.1.1           | NestJS 11.2.6 |
| Build/paquetes | Maven (Maven Wrapper)       | npm           |
| Persistencia   | Spring Data JPA / Hibernate | TypeORM       |
| Base de datos  | PostgreSQL                  | PostgreSQL    |

Infraestructura compartida: RabbitMQ, Docker Compose y Postman.

## Organización arquitectónica

Ambos servicios separan Domain, Application, Infrastructure e Interfaces/adapters:

- el dominio no depende del framework (Spring o NestJS);
- los DTO de REST no forman parte del dominio;
- los mensajes protobuf se traducen a tipos internos en los adapters gRPC, sin introducir tipos de transporte en el dominio o la aplicación;
- los mensajes RabbitMQ se traducen en los adapters de infraestructura antes de llegar a los casos de uso;
- las entidades ORM permanecen fuera del dominio;
- cada microservicio mantiene su propio modelo y su propia persistencia.

## Flujo de revisión

1. Se crea una Pregunta en estado `BORRADOR`, con `numeroVersionRevision = 0`.
2. Se envía a revisión: `BORRADOR → PENDIENTE_REVISION`. En el primer
   envío, `numeroVersionRevision` pasa de `0` a `1`.
3. Pregunta persiste el cambio de estado y registra el evento de
   integración `PreguntaEnviadaARevision` en su Outbox dentro de la misma
   transacción.
4. RabbitMQ entrega `PreguntaEnviadaARevision` a Revisión, que registra una
   solicitud local de revisión.
5. Se crea una Revisión con uno o más revisores asignados.
6. Revisión llama de forma síncrona a Pregunta mediante gRPC
   (`IniciarRevision`).
7. Pregunta transiciona `PENDIENTE_REVISION → EN_REVISION`.
8. Los revisores asignados registran sus evaluaciones; se requiere que
   todos evalúen para obtener un resultado.
9. El resultado es `FAVORABLE` si hay unanimidad favorable, o
   `DESFAVORABLE` si algún revisor evalúa en contra.
10. Al finalizar, Revisión persiste el resultado y registra
    `RevisionFinalizada` en su Outbox; RabbitMQ lo entrega a Pregunta.
11. Pregunta aplica el resultado: `FAVORABLE → APROBADA` o
    `DESFAVORABLE → RECHAZADA`.
12. Una pregunta `RECHAZADA` puede reabrirse (`RECHAZADA → BORRADOR`),
    conservando su `numeroVersionRevision`.

## Comunicación entre microservicios

### REST

REST es la interfaz externa de ambos servicios, consumida por clientes como Postman.

### gRPC

El contrato canónico está definido en [contracts/grpc/pregunta_revision.proto](contracts/grpc/pregunta_revision.proto). `revision-service` actúa como cliente y `pregunta-service` como servidor. La operación `IniciarRevision` permite iniciar la revisión de una versión exacta de una pregunta y obtener el snapshot correspondiente.

### RabbitMQ y Transactional Outbox

Ambos servicios publican y consumen sobre el exchange `saberpro.events`:

| Evento                     | Productor → Consumidor | Routing key                 | Cola                                 |
| -------------------------- | ---------------------- | --------------------------- | ------------------------------------ |
| `PreguntaEnviadaARevision` | Pregunta → Revisión    | `pregunta.enviada_revision` | `revision.pregunta-enviada.queue`    |
| `RevisionFinalizada`       | Revisión → Pregunta    | `revision.finalizada`       | `pregunta.revision-finalizada.queue` |

Los esquemas de ambos eventos están en [contracts/events](contracts/events).

Cada servicio implementa Transactional Outbox: el cambio de estado local y la fila de Outbox se persisten en la misma transacción del productor; la publicación a RabbitMQ ocurre posteriormente mediante un proceso de sondeo.

## API REST

### Pregunta — `http://localhost:8080`

| Método | Ruta                                     | Propósito                             |
| ------ | ---------------------------------------- | ------------------------------------- |
| POST   | `/api/v1/preguntas`                      | Crear una pregunta en `BORRADOR`      |
| GET    | `/api/v1/preguntas/{id}`                 | Obtener una pregunta                  |
| PUT    | `/api/v1/preguntas/{id}`                 | Actualizar una pregunta en `BORRADOR` |
| POST   | `/api/v1/preguntas/{id}/envios-revision` | Enviar la pregunta a revisión         |
| POST   | `/api/v1/preguntas/{id}/reaperturas`     | Reabrir una pregunta `RECHAZADA`      |

### Revisión — `http://localhost:3000`

| Método | Ruta                                    | Propósito                                         |
| ------ | --------------------------------------- | ------------------------------------------------- |
| GET    | `/api/v1/preguntas-pendientes-revision` | Listar preguntas pendientes de revisión           |
| POST   | `/api/v1/revisiones`                    | Crear una revisión con sus revisores              |
| GET    | `/api/v1/revisiones/{id}`               | Obtener una revisión                              |
| GET    | `/api/v1/revisiones?preguntaId={id}`    | Listar el historial de revisiones de una pregunta |
| POST   | `/api/v1/revisiones/{id}/evaluaciones`  | Registrar la evaluación de un revisor             |

Códigos HTTP relevantes (no todos aplican a todos los endpoints):

- `400`: entrada o formato inválido;
- `404`: recurso inexistente;
- `409`: conflicto de estado o invariante;
- `422`: pregunta estructuralmente no apta para envío a revisión;
- `502`: respuesta gRPC incompatible;
- `503`: servicio Pregunta/gRPC no disponible.

## Requisitos

- Docker
- Docker Compose v2

No se requieren instalaciones locales de Java, Node o PostgreSQL para levantar la solución con Docker. Java y Node solo son necesarios si se quiere compilar o ejecutar alguno de los servicios directamente, fuera de contenedores.

## Ejecución

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

```bash
docker compose ps
```

El entorno levanta cinco servicios: `pregunta-db`, `revision-db`, `rabbitmq`, `pregunta-service` y `revision-service`.

URLs expuestas:

- Pregunta REST: `http://localhost:8080`
- Revisión REST: `http://localhost:3000`
- RabbitMQ Management: `http://localhost:15672` (usuario `saberpro`, contraseña `saberpro`; credenciales de demostración local definidas en `compose.yaml`)

Cada microservicio usa su propio PostgreSQL, con un volumen Docker independiente por servicio; no hay base de datos compartida ni claves foráneas entre microservicios.

El compose local activa `SPRING_JPA_HIBERNATE_DDL_AUTO=update` en Pregunta y `REVISION_DB_SYNCHRONIZE=true` en Revisión para crear el esquema automáticamente en el entorno de demostración del Taller. Los valores por defecto del código son conservadores (`none` y `false`, respectivamente). Estos valores están destinados únicamente al entorno local de demostración y no representan una configuración de producción.

## Pruebas con Postman

Artefactos disponibles en [postman](postman):

- [Taller2-SaberPro.postman_collection.json](postman/Taller2-SaberPro.postman_collection.json)
- [Taller2-Local.postman_environment.json](postman/Taller2-Local.postman_environment.json)

Procedimiento:

1. levantar el entorno con Docker Compose;
2. importar ambos archivos en Postman;
3. seleccionar el Environment **Taller 2 — Local**;
4. ejecutar la Collection completa como Collection Run;
5. mantener el orden definido en la Collection.

El Environment solo define `preguntaBaseUrl` y `revisionBaseUrl`; los IDs y contadores se administran como Collection Variables durante la ejecución y no requieren edición manual.

La Collection contiene tres escenarios:

- **01 - Flujo favorable**: crea una pregunta, la envía a revisión, la evalúan dos revisores de forma unánime y verifica que quede `APROBADA`.
- **02 - Rechazo y reapertura**: envía una pregunta a revisión, un revisor la evalúa `DESFAVORABLE`, verifica que quede `RECHAZADA` y comprueba la reapertura a `BORRADOR` conservando la versión.
- **03 - Errores representativos**: comprueba respuestas de error ante un UUID inválido, una pregunta inexistente y una actualización fuera de `BORRADOR`.

El número de requests ejecutadas puede variar porque algunos pasos realizan sondeo mientras esperan los efectos de la comunicación asíncrona; una ejecución correcta debe finalizar sin pruebas fallidas.

## Pruebas automatizadas

Pregunta (Maven Wrapper):

```bash
cd pregunta-service
./mvnw test
```

Revisión (npm):

```bash
cd revision-service
npm ci
npm test
```

Para levantar todo el sistema con Docker no se requiere instalar Java, Maven, Node.js ni PostgreSQL localmente. Para ejecutar las suites directamente fuera de Docker sí se necesita Java 21 para `pregunta-service` y Node.js para `revision-service`.

## Detener el entorno

```bash
docker compose down
```

Para además eliminar los volúmenes y los datos persistidos:

```bash
docker compose down -v
```
