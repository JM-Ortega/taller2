#!/usr/bin/env node
// E2E smoke test against real running containers (no mocks, no direct DB access).
// Usage: node scripts/e2e-smoke.mjs
// Env: PREGUNTA_BASE_URL (default http://localhost:8080)
//      REVISION_BASE_URL (default http://localhost:3000)

const PREGUNTA_BASE_URL = process.env.PREGUNTA_BASE_URL ?? 'http://localhost:8080';
const REVISION_BASE_URL = process.env.REVISION_BASE_URL ?? 'http://localhost:3000';

const POLL_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1_000;

function log(step, message) {
  console.log(`[${new Date().toISOString()}] [${step}] ${message}`);
}

function fail(step, message, details) {
  console.error(`\n[FAIL] [${step}] ${message}`);
  if (details !== undefined) {
    console.error(details);
  }
  process.exit(1);
}

async function request(method, url, body) {
  const init = {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    return { ok: false, status: 0, statusText: String(err), body: null, headers: null };
  }
  const text = await response.text();
  let parsed = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body: parsed,
    headers: response.headers,
  };
}

async function poll(step, description, fn, timeoutMs = POLL_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let lastResult;
  while (Date.now() < deadline) {
    lastResult = await fn();
    if (lastResult.done) {
      return lastResult.value;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  fail(step, `Timeout esperando: ${description}`, lastResult ? lastResult.lastSeen : undefined);
}

function assertEqual(step, label, actual, expected) {
  if (actual !== expected) {
    fail(step, `${label}: se esperaba ${JSON.stringify(expected)}, se obtuvo ${JSON.stringify(actual)}`);
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(step, label, value) {
  if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
    fail(step, `${label}: se esperaba un UUID válido, se obtuvo ${JSON.stringify(value)}`);
  }
}

async function main() {
  log('SETUP', `Pregunta base URL: ${PREGUNTA_BASE_URL}`);
  log('SETUP', `Revision base URL: ${REVISION_BASE_URL}`);

  // Paso 1 — Esperar REST reales
  await poll('WAIT_PREGUNTA', 'Pregunta REST responde', async () => {
    const res = await request('GET', `${PREGUNTA_BASE_URL}/api/v1/preguntas/00000000-0000-0000-0000-000000000000`);
    return { done: res.status > 0, lastSeen: res };
  });
  log('WAIT_PREGUNTA', 'Pregunta REST está arriba.');

  await poll('WAIT_REVISION', 'Revisión REST responde 200 en pendientes', async () => {
    const res = await request('GET', `${REVISION_BASE_URL}/api/v1/preguntas-pendientes-revision`);
    return { done: res.status === 200, lastSeen: res };
  });
  log('WAIT_REVISION', 'Revisión REST está arriba.');

  // Paso 2 — Crear Pregunta
  const crearPreguntaBody = {
    autorId: 'autor-e2e',
    contexto: 'Una institución evalúa la arquitectura de una aplicación distribuida.',
    preguntaDirecta: '¿Cuál alternativa describe una comunicación síncrona entre microservicios?',
    opciones: [
      { texto: 'Un servicio invoca gRPC y espera la respuesta del otro servicio.', correcta: true },
      { texto: 'Un servicio publica un evento y continúa sin esperar al consumidor.', correcta: false },
      { texto: 'Dos servicios escriben directamente en la misma base de datos.', correcta: false },
      { texto: 'Un consumidor procesa un mensaje de una cola sin responder al productor.', correcta: false },
      { texto: 'Un servicio almacena un evento en su Outbox local.', correcta: false },
    ],
    justificacion: 'En una comunicación síncrona el emisor espera una respuesta; gRPC permite ese patrón.',
    bibliografia: 'Material del curso de Arquitectura de Microservicios.',
    competencia: 'Diseño de software',
    tema: 'Microservicios',
    subtema: 'Comunicación entre microservicios',
    nivelDificultad: 'MEDIO',
  };

  const crearRes = await request('POST', `${PREGUNTA_BASE_URL}/api/v1/preguntas`, crearPreguntaBody);
  if (crearRes.status !== 201) {
    fail('CREAR_PREGUNTA', `Se esperaba 201, se obtuvo ${crearRes.status}`, crearRes.body);
  }
  const preguntaId = crearRes.body?.preguntaId;
  if (!preguntaId) {
    fail('CREAR_PREGUNTA', 'No se recibió preguntaId', crearRes.body);
  }
  assertUuid('CREAR_PREGUNTA', 'preguntaId', preguntaId);
  const location = crearRes.headers?.get('location');
  assertEqual('CREAR_PREGUNTA', 'Location', location, `/api/v1/preguntas/${preguntaId}`);
  assertEqual('CREAR_PREGUNTA', 'estado', crearRes.body.estado, 'BORRADOR');
  assertEqual('CREAR_PREGUNTA', 'numeroVersionRevision', crearRes.body.numeroVersionRevision, 0);
  log('CREAR_PREGUNTA', `Pregunta creada: preguntaId=${preguntaId}`);

  // Paso 3 — Enviar a revisión
  const envioRes = await request('POST', `${PREGUNTA_BASE_URL}/api/v1/preguntas/${preguntaId}/envios-revision`);
  if (envioRes.status !== 200) {
    fail('ENVIAR_REVISION', `Se esperaba 200, se obtuvo ${envioRes.status}`, envioRes.body);
  }
  assertEqual('ENVIAR_REVISION', 'estado', envioRes.body.estado, 'PENDIENTE_REVISION');
  assertEqual('ENVIAR_REVISION', 'numeroVersionRevision', envioRes.body.numeroVersionRevision, 1);
  log('ENVIAR_REVISION', `Pregunta ${preguntaId} enviada a revisión (v1).`);

  // Paso 4 — Probar Rabbit Pregunta -> Revisión (proyección de pendientes)
  await poll('RABBIT_PREGUNTA_A_REVISION', `pendiente (${preguntaId}, v1) visible en Revisión`, async () => {
    const res = await request('GET', `${REVISION_BASE_URL}/api/v1/preguntas-pendientes-revision`);
    if (res.status !== 200) {
      return { done: false, lastSeen: res };
    }
    const match = Array.isArray(res.body)
      && res.body.some((item) => item.preguntaId === preguntaId && item.versionPregunta === 1);
    return { done: match, lastSeen: res.body };
  });
  log('RABBIT_PREGUNTA_A_REVISION', 'Proyección de pendientes en Revisión confirmada vía RabbitMQ.');

  // Paso 5 — Crear Revisión (dispara gRPC)
  const crearRevisionBody = {
    preguntaId,
    revisorIds: ['revisor-e2e-1', 'revisor-e2e-2'],
  };
  const crearRevisionRes = await request('POST', `${REVISION_BASE_URL}/api/v1/revisiones`, crearRevisionBody);
  if (crearRevisionRes.status !== 201) {
    fail('CREAR_REVISION', `Se esperaba 201, se obtuvo ${crearRevisionRes.status}`, crearRevisionRes.body);
  }
  const revisionId = crearRevisionRes.body?.revisionId;
  if (!revisionId) {
    fail('CREAR_REVISION', 'No se recibió revisionId', crearRevisionRes.body);
  }
  assertUuid('CREAR_REVISION', 'revisionId', revisionId);
  const revisionLocation = crearRevisionRes.headers?.get('location');
  assertEqual('CREAR_REVISION', 'Location', revisionLocation, `/api/v1/revisiones/${revisionId}`);
  assertEqual('CREAR_REVISION', 'preguntaId', crearRevisionRes.body.preguntaId, preguntaId);
  assertEqual('CREAR_REVISION', 'versionPregunta', crearRevisionRes.body.versionPregunta, 1);
  assertEqual('CREAR_REVISION', 'resultadoFinal', crearRevisionRes.body.resultadoFinal, null);
  assertEqual('CREAR_REVISION', 'evaluaciones.length', crearRevisionRes.body.evaluaciones.length, 0);

  // Snapshot gRPC (preguntaParaRevision): verifica el contenido real propagado por
  // IniciarRevision, incluyendo el patrón correcta=[true,false,false,false,false]
  // que expuso la omisión de valores por defecto de proto3 en el decode de gRPC.
  const snapshot = crearRevisionRes.body.preguntaParaRevision;
  if (!snapshot) {
    fail('CREAR_REVISION', 'No se recibió snapshot preguntaParaRevision', crearRevisionRes.body);
  }
  assertEqual('CREAR_REVISION', 'preguntaParaRevision.contexto', snapshot.contexto, crearPreguntaBody.contexto);
  assertEqual(
    'CREAR_REVISION',
    'preguntaParaRevision.preguntaDirecta',
    snapshot.preguntaDirecta,
    crearPreguntaBody.preguntaDirecta,
  );
  assertEqual(
    'CREAR_REVISION',
    'preguntaParaRevision.justificacion',
    snapshot.justificacion,
    crearPreguntaBody.justificacion,
  );
  assertEqual(
    'CREAR_REVISION',
    'preguntaParaRevision.bibliografia',
    snapshot.bibliografia,
    crearPreguntaBody.bibliografia,
  );
  assertEqual(
    'CREAR_REVISION',
    'preguntaParaRevision.competencia',
    snapshot.competencia,
    crearPreguntaBody.competencia,
  );
  assertEqual('CREAR_REVISION', 'preguntaParaRevision.tema', snapshot.tema, crearPreguntaBody.tema);
  assertEqual('CREAR_REVISION', 'preguntaParaRevision.subtema', snapshot.subtema, crearPreguntaBody.subtema);
  assertEqual(
    'CREAR_REVISION',
    'preguntaParaRevision.nivelDificultad',
    snapshot.nivelDificultad,
    crearPreguntaBody.nivelDificultad,
  );

  if (!Array.isArray(snapshot.opciones) || snapshot.opciones.length !== 5) {
    fail('CREAR_REVISION', 'preguntaParaRevision.opciones debe tener exactamente 5 elementos', snapshot.opciones);
  }
  const correctasEsperadas = [true, false, false, false, false];
  for (let i = 0; i < 5; i += 1) {
    assertEqual(
      'CREAR_REVISION',
      `preguntaParaRevision.opciones[${i}].texto`,
      snapshot.opciones[i].texto,
      crearPreguntaBody.opciones[i].texto,
    );
    assertEqual(
      'CREAR_REVISION',
      `preguntaParaRevision.opciones[${i}].correcta`,
      snapshot.opciones[i].correcta,
      correctasEsperadas[i],
    );
  }

  log('CREAR_REVISION', `Revisión creada: revisionId=${revisionId} (dispara gRPC IniciarRevision).`);

  // Paso 6 — Comprobar efecto gRPC en Pregunta
  await poll('GRPC_EN_REVISION', `Pregunta ${preguntaId} pasa a EN_REVISION por gRPC`, async () => {
    const res = await request('GET', `${PREGUNTA_BASE_URL}/api/v1/preguntas/${preguntaId}`);
    if (res.status !== 200) {
      return { done: false, lastSeen: res };
    }
    const done = res.body.estado === 'EN_REVISION' && res.body.numeroVersionRevision === 1;
    return { done, lastSeen: res.body };
  }, 20_000);
  log('GRPC_EN_REVISION', `Pregunta ${preguntaId} confirmada en EN_REVISION vía gRPC.`);

  const pendientesTrasCrear = await request('GET', `${REVISION_BASE_URL}/api/v1/preguntas-pendientes-revision`);
  const siguePendiente = Array.isArray(pendientesTrasCrear.body)
    && pendientesTrasCrear.body.some((item) => item.preguntaId === preguntaId && item.versionPregunta === 1);
  if (siguePendiente) {
    fail('GRPC_EN_REVISION', `La pareja (${preguntaId}, v1) sigue apareciendo como pendiente tras crear la Revisión`, pendientesTrasCrear.body);
  }
  log('GRPC_EN_REVISION', 'La pregunta ya no aparece como pendiente de revisión.');

  // Paso 7 — Primera evaluación (no finaliza)
  const eval1Body = {
    revisorId: 'revisor-e2e-1',
    criterios: [{ nombre: 'Coherencia entre contexto y pregunta', cumple: true }],
    observaciones: 'Sin observaciones.',
    resultado: 'FAVORABLE',
  };
  const eval1Res = await request('POST', `${REVISION_BASE_URL}/api/v1/revisiones/${revisionId}/evaluaciones`, eval1Body);
  if (eval1Res.status !== 200) {
    fail('EVALUACION_1', `Se esperaba 200, se obtuvo ${eval1Res.status}`, eval1Res.body);
  }
  assertEqual('EVALUACION_1', 'evaluaciones.length', eval1Res.body.evaluaciones.length, 1);
  assertEqual('EVALUACION_1', 'resultadoFinal', eval1Res.body.resultadoFinal, null);
  log('EVALUACION_1', 'Primera evaluación registrada, revisión aún no finaliza.');

  // Paso 8 — Segunda evaluación (finaliza FAVORABLE)
  const eval2Body = {
    revisorId: 'revisor-e2e-2',
    criterios: [{ nombre: 'Coherencia entre contexto y pregunta', cumple: true }],
    observaciones: '',
    resultado: 'FAVORABLE',
  };
  const eval2Res = await request('POST', `${REVISION_BASE_URL}/api/v1/revisiones/${revisionId}/evaluaciones`, eval2Body);
  if (eval2Res.status !== 200) {
    fail('EVALUACION_2', `Se esperaba 200, se obtuvo ${eval2Res.status}`, eval2Res.body);
  }
  assertEqual('EVALUACION_2', 'evaluaciones.length', eval2Res.body.evaluaciones.length, 2);
  assertEqual('EVALUACION_2', 'resultadoFinal', eval2Res.body.resultadoFinal, 'FAVORABLE');
  log('EVALUACION_2', 'Segunda evaluación registrada, revisión finalizada FAVORABLE.');

  // Paso 9 — Probar Rabbit Revisión -> Pregunta
  await poll('RABBIT_REVISION_A_PREGUNTA', `Pregunta ${preguntaId} pasa a APROBADA por RabbitMQ`, async () => {
    const res = await request('GET', `${PREGUNTA_BASE_URL}/api/v1/preguntas/${preguntaId}`);
    if (res.status !== 200) {
      return { done: false, lastSeen: res };
    }
    const done = res.body.estado === 'APROBADA' && res.body.numeroVersionRevision === 1;
    return { done, lastSeen: res.body };
  });
  log('RABBIT_REVISION_A_PREGUNTA', `Pregunta ${preguntaId} confirmada APROBADA vía RabbitMQ.`);

  // Paso 10 — Comprobaciones finales
  const revisionFinalRes = await request('GET', `${REVISION_BASE_URL}/api/v1/revisiones/${revisionId}`);
  if (revisionFinalRes.status !== 200) {
    fail('CHECK_FINAL', `GET revisión: se esperaba 200, se obtuvo ${revisionFinalRes.status}`, revisionFinalRes.body);
  }
  assertEqual('CHECK_FINAL', 'resultadoFinal', revisionFinalRes.body.resultadoFinal, 'FAVORABLE');
  assertEqual('CHECK_FINAL', 'evaluaciones.length', revisionFinalRes.body.evaluaciones.length, 2);

  const historialRes = await request('GET', `${REVISION_BASE_URL}/api/v1/revisiones?preguntaId=${preguntaId}`);
  if (historialRes.status !== 200) {
    fail('CHECK_FINAL', `GET historial: se esperaba 200, se obtuvo ${historialRes.status}`, historialRes.body);
  }
  if (!Array.isArray(historialRes.body) || historialRes.body.length !== 1) {
    fail('CHECK_FINAL', 'El historial debe contener exactamente una revisión', historialRes.body);
  }
  assertEqual('CHECK_FINAL', 'historial[0].revisionId', historialRes.body[0].revisionId, revisionId);
  log('CHECK_FINAL', 'Historial de revisiones verificado.');

  console.log('\n=== PASS ===');
  console.log(`preguntaId: ${preguntaId}`);
  console.log(`revisionId: ${revisionId}`);
  console.log('Flujo E2E cross-process (REST + gRPC + RabbitMQ + Outbox) verificado contra procesos reales.');
}

main().catch((err) => {
  fail('UNCAUGHT', err.message, err.stack);
});
