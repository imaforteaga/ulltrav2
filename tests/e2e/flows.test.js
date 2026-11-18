import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launch, newApp, onboard, go, stored, settle } from './helpers.js';

let env;
before(async () => { env = await launch(); });
after(async () => { await env.close(); });

test('onboarding → Inicio, profile saved', async () => {
  const { page, errors, context } = await newApp(env);
  assert.match(await page.innerText('#main'), /bienvenido/i);
  await onboard(page);
  assert.match(await page.innerText('#main'), /Buen[oa]s [a-zéíáóú]+, Nico/);
  const s = await stored(page);
  assert.equal(s.profile.name, 'Nico'); assert.equal(s.weights[0].kg, 80); assert.equal(s.habits.length, 8);
  assert.deepEqual(errors, []); await context.close();
});

test('register a meal → shows in Nutrición, counts toward the day, survives a reload', async () => {
  const { page, errors, context } = await newApp(env); await onboard(page);
  await go(page, '#/nutrition');
  await page.click('[data-act=add-meal] >> nth=0');
  await page.fill('#food-q', 'pollo');
  await page.click('[data-act=pick-food] >> nth=0');
  await page.fill('#q-v', '200');
  const prev = await page.innerText('#q-prev'); assert.match(prev, /kcal/);
  await page.click('[data-act=save-food]'); await page.waitForTimeout(500);
  assert.match(await page.innerText('#main'), /pollo/i);
  const s = await stored(page); assert.equal(s.foods.length, 1); assert.ok(s.foods[0].kcal > 200);
  await page.reload(); await page.waitForSelector('#nav:not(.hide)'); await go(page, '#/nutrition');
  assert.match(await page.innerText('#main'), /pollo/i);
  assert.deepEqual(errors, []); await context.close();
});

test('workout: free session → add exercise → complete a set → finish → appears in history', async () => {
  const { page, errors, context } = await newApp(env); await onboard(page);
  await go(page, '#/training');
  await page.click('[data-act=start-free]'); await page.waitForTimeout(400);
  await page.click('[data-act=sess-add-ex]'); await page.fill('#ae-q', 'Sentadilla'); await page.click('[data-act=ae-pick] >> nth=0'); await page.waitForTimeout(400);
  await page.fill('[data-s="0,0,kg"]', '100'); await page.fill('[data-s="0,0,reps"]', '5');
  await page.click('[data-act=set-done] >> nth=0'); await page.waitForTimeout(300);
  assert.match(await page.innerText('#main'), /Descanso|descanso/);                    // rest timer appears
  await page.click('[data-act=sess-finish]'); await page.waitForTimeout(900);
  const s = await stored(page); assert.equal(s.sessions.length, 1); assert.equal(s.sessions[0].exercises[0].sets[0].kg, '100'); assert.equal(s.active, null);
  await page.keyboard.press('Escape'); await go(page, '#/training/history');
  assert.match(await page.innerText('#main'), /500 kg/);                                // volume 100 × 5
  assert.deepEqual(errors, []); await context.close();
});

test('cierre del día: rating, feeling and text are saved', async () => {
  const { page, errors, context } = await newApp(env); await onboard(page);
  await page.click('[data-act=checkin]');
  await page.fill('#ci-t', 'Buen día, entrené y comí bien.');
  await page.locator('#ci-p').fill('9');
  await page.click('[data-act=ci-save]'); await page.waitForTimeout(500);
  const s = await stored(page); const c = Object.values(s.checkins)[0];
  assert.equal(c.perf, 9); assert.match(c.text, /entrené/);
  assert.match(await page.innerText('#main'), /9\/10 rendimiento/);
  assert.deepEqual(errors, []); await context.close();
});

test('finanzas: add an expense → month summary and list update', async () => {
  const { page, errors, context } = await newApp(env); await onboard(page);
  await go(page, '#/finance');
  await page.click('[data-act=fin-add] >> nth=0');
  await page.fill('#fx-a', '1500'); await page.fill('#fx-n', 'Súper');
  await page.click('[data-act=fin-save]'); await page.waitForTimeout(500);
  const s = await stored(page); assert.equal(s.fin.tx.length, 1); assert.equal(s.fin.tx[0].amount, 1500); assert.equal(s.fin.tx[0].type, 'out');
  const t = await page.innerText('#main'); assert.match(t, /1\.500/); assert.match(t, /Súper/);
  assert.deepEqual(errors, []); await context.close();
});

test('data saved by the previous version loads untouched', async () => {
  const old = {
    v: 1, profile: { name: 'Vero', objective: 'fatLoss', age: 33, height: 165, trainingDays: 4, kcal: 1900, protein: 130, carbs: 200, fat: 60, water: 2500, sleepTarget: 8, createdAt: '2026-10-01', disabledCats: [], mobilityTarget: 4 },
    weights: [{ id: 'w1', date: '2026-10-01', kg: 70 }, { id: 'w2', date: '2026-11-10', kg: 68.4 }], foods: [], water: [], sleep: {}, routines: [], sessions: [], mobSessions: [], customMob: [], favMeals: [], customFoods: [],
    habits: [{ id: 'h1', name: 'Leer la Biblia', key: 'bible', active: true, counts: true, order: 0 }], habitLogs: {}, supplements: [], supLogs: {}, journal: [{ id: 'j1', date: '2026-11-01', text: 'Mi primera nota', mood: 4 }],
    milestones: [], favVerses: [], readVerses: {}, photoMeta: [], measures: [], active: null, theme: 'auto', savedAt: 1760000000000,
  };
  const { page, errors, context } = await newApp(env, { initState: old, });
  await page.waitForSelector('#nav:not(.hide)');
  assert.match(await page.innerText('#main'), /Vero/); assert.match(await page.innerText('#main'), /68\.4/);
  await go(page, '#/home/journal'); assert.match(await page.innerText('#main'), /Mi primera nota/);
  const s = await stored(page); assert.equal(s.journal.length, 1); assert.equal(s.weights.length, 2); assert.equal(s.v, 1);
  assert.deepEqual(errors, []); await context.close();
});

test('copia de seguridad: export → change data → restore brings the exported data back', async () => {
  const { page, errors, context } = await newApp(env); await onboard(page);
  await page.click('[data-act=add-water]'); await page.waitForTimeout(300);
  await go(page, '#/profile');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=export]')]);
  const file = await dl.path(); const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(json.app, 'forge-web'); assert.equal(json.state.water.length, 1);
  await go(page, '#/home'); await page.click('[data-act=add-water]'); await page.click('[data-act=add-water]');
  assert.equal((await stored(page)).water.length, 3);
  await go(page, '#/profile'); await page.setInputFiles('#imp-f', file); await page.waitForTimeout(1200);
  assert.equal((await stored(page)).water.length, 1);
  assert.deepEqual(errors, []); await context.close();
});

test('works offline once loaded (service worker)', async () => {
  const { page, context } = await newApp(env); await onboard(page);
  await page.evaluate(() => navigator.serviceWorker.ready); await page.waitForTimeout(800);
  await context.setOffline(true);
  await page.reload(); await page.waitForSelector('#nav:not(.hide)');
  assert.match(await page.innerText('#main'), /Buen[oa]s [a-zéíáóú]+, Nico/);
  await context.close();
});

test('desktop layout renders the side rail and the same screens', async () => {
  const { page, errors, context } = await newApp(env, { desktop: true }); await onboard(page);
  assert.ok(await page.isVisible('#nav .brand'));
  for (const r of ['#/nutrition', '#/training', '#/progress', '#/finance', '#/profile']) { await go(page, r); assert.ok((await page.innerText('#main')).length > 40); }
  await page.screenshot({ path: new URL('../../tests/e2e/__shots__/desktop-profile.png', import.meta.url).pathname }).catch(() => { });
  assert.deepEqual(errors, []); await context.close();
});

test('Conocerme: answer from the screen → saved and persisted; "Más tarde" skips; an insight offers a profile fix', async () => {
  const { page, errors, context } = await newApp(env); await onboard(page);
  assert.match(await page.innerText('#main'), /conocerme/i);                                 // tile on Inicio
  await page.click('[data-act=go][data-v="#/home/about"]'); await page.waitForTimeout(500);
  await page.click('[data-act=ab-ans][data-id=foco][data-v=fuerza]'); await page.waitForTimeout(500);
  assert.equal((await stored(page)).about.foco.v, 'fuerza');
  await page.click('[data-act=ab-skip]'); await page.waitForTimeout(300);                    // meta_12m
  await page.click('[data-act=ab-skip]'); await page.waitForTimeout(300);                    // por_que
  await page.click('[data-act=ab-ans][data-id=dias_real][data-v="5"]'); await page.waitForTimeout(500);
  assert.match(await page.innerText('#main'), /Lo que aprendí de vos/);
  await page.click('[data-act=ab-fix]'); await page.waitForTimeout(500);
  assert.equal((await stored(page)).profile.trainingDays, 5);
  await page.reload(); await page.waitForSelector('#nav:not(.hide)'); await go(page, '#/home/about');
  assert.match(await page.innerText('#main'), /Fuerza/); assert.match(await page.innerText('#main'), /5/);
  await page.click('[data-act=ab-edit][data-id=foco]'); await page.waitForTimeout(500);       // edit an old answer in the sheet
  await page.click('#sheet [data-act=ab-ans][data-v=energia]'); await page.waitForTimeout(500);
  assert.equal((await stored(page)).about.foco.v, 'energia');
  assert.deepEqual(errors, []); await context.close();
});
