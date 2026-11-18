import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, newApp, onboard, go, settle, running } from './helpers.js';

let env;
before(async () => { env = await launch(); });
after(async () => { await env.close(); });

const mark = (page, sel) => page.evaluate(s => document.querySelectorAll(s).forEach(e => { e.__mark = true; }), sel);
const unmarked = (page, sel) => page.evaluate(s => [...document.querySelectorAll(s)].filter(e => !e.__mark).length, sel);

test('a tap refreshes the screen WITHOUT replaying entrances: same DOM nodes, no "rise" animations', async () => {
  const { page, errors, context } = await newApp(env); await onboard(page);
  const sel = '#main .card, #main .ring, #main .ring .fg, #main .bar, #main .check';
  await mark(page, sel);
  await page.click('[data-act=add-water]'); await page.waitForTimeout(150);
  assert.equal(await running(page, 'rise'), 0);
  assert.equal(await unmarked(page, sel), 0, 'every card/ring/bar/check must be the same element as before the tap');
  assert.equal(await page.getAttribute('#main', 'class'), '');                        // the .anim stagger window is closed
  assert.deepEqual(errors, []); await context.close();
});

test('rings animate from their previous value (not from empty) when data changes', async () => {
  const { page, context } = await newApp(env); await onboard(page);
  const off = () => page.evaluate(() => [...document.querySelectorAll('.ring .fg')].map(e => parseFloat(getComputedStyle(e).strokeDashoffset)));
  const before = (await off())[2];                                                    // water ring, empty
  await page.click('[data-act=add-water]'); await page.waitForTimeout(150);
  const mid = (await off())[2];
  await page.waitForTimeout(1200);
  const end = (await off())[2];
  assert.ok(end < before, 'ring filled');
  assert.ok(mid < before && mid > end, `mid-transition value ${mid} should be between ${before} and ${end}`);
  assert.ok(mid <= before && before - mid < (before - end), 'it started from where it was, not from 0');
  await context.close();
});

test('numbers count to their new value instead of jumping', async () => {
  const { page, context } = await newApp(env); await onboard(page);
  const txt = () => page.evaluate(() => document.querySelectorAll('.ring .mid')[2]?.textContent);
  assert.equal(await txt(), '0.0l');
  await page.click('[data-act=add-water]'); await page.click('[data-act=add-water]'); await page.click('[data-act=add-water]');
  await page.waitForTimeout(100);
  const seen = new Set([await txt()]);
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(60); seen.add(await txt()); }
  await page.waitForTimeout(600);
  assert.equal(await txt(), '0.8l');                                                  // 750 ml
  assert.ok(seen.size >= 2, `saw intermediate values: ${[...seen]}`);
  await context.close();
});

test('navigating DOES play the staggered entrance, and it settles afterwards', async () => {
  const { page, context } = await newApp(env); await onboard(page);
  await go(page, '#/nutrition'); await page.waitForTimeout(50);
  assert.equal(await page.getAttribute('#main', 'class'), 'anim');
  assert.ok(await running(page, 'rise') >= 2);
  const delays = await page.evaluate(() => [...document.querySelectorAll('#main .card')].slice(0, 4).map(e => getComputedStyle(e).animationDelay));
  assert.equal(new Set(delays).size, delays.length, `stagger delays differ: ${delays}`);
  await settle(page);
  assert.equal(await page.getAttribute('#main', 'class'), '');
  await context.close();
});

test('prefers-reduced-motion: no entrance animation, content visible immediately', async () => {
  const { page, context } = await newApp(env, { reducedMotion: true }); await onboard(page);
  await go(page, '#/nutrition');
  const o = await page.evaluate(() => getComputedStyle(document.querySelector('#main .card')).opacity);
  assert.equal(o, '1');
  const long = await page.evaluate(() => document.getAnimations().filter(a => (a.effect.getComputedTiming().duration || 0) > 5).length);
  assert.equal(long, 0, 'no animation longer than a frame');
  await context.close();
});

test('only transform/opacity are animated by the entrance and list effects', async () => {
  const { page, context } = await newApp(env); await onboard(page);
  await go(page, '#/progress'); await page.waitForTimeout(30);
  const props = await page.evaluate(() => {
    const out = new Set();
    document.getAnimations().forEach(a => { if (a.animationName === 'rise') (a.effect.getKeyframes() || []).forEach(k => Object.keys(k).forEach(p => out.add(p))); });
    return [...out].filter(p => !['offset', 'computedOffset', 'easing', 'composite'].includes(p)).sort();
  });
  assert.deepEqual(props, ['opacity', 'transform']);
  await context.close();
});

test('habit check keeps its element and flips to "on" (so the CSS draw-in transition runs)', async () => {
  const { page, context } = await newApp(env); await onboard(page);
  await page.evaluate(() => { window.__c = document.querySelector('[data-act=toggle-habit]:not(.on)'); });
  await page.evaluate(() => window.__c.click()); await page.waitForTimeout(80);
  assert.ok(await page.evaluate(() => window.__c.isConnected && window.__c.classList.contains('on')));
  const dash = await page.evaluate(() => getComputedStyle(window.__c.querySelector('path')).transitionProperty);
  assert.match(dash, /stroke-dashoffset/);
  await context.close();
});

test('lists: removing a row keeps the other rows (FLIP) and fades a ghost of the removed one', async () => {
  const { page, context } = await newApp(env); await onboard(page);
  const add = async q => { await page.click('[data-act=add-meal] >> nth=0'); await page.fill('#food-q', q); await page.click('[data-act=pick-food] >> nth=0'); await page.click('[data-act=save-food]'); await page.waitForTimeout(450); };
  await go(page, '#/nutrition'); await add('pollo'); await add('arroz'); await add('huevo');
  const rows = '#main [data-key^="f-"]';
  assert.equal(await page.locator(rows).count(), 3);
  await mark(page, rows);
  await page.click('[data-act=del-food] >> nth=0');
  await page.waitForTimeout(60);
  assert.equal(await page.locator(rows).count(), 2);
  assert.equal(await unmarked(page, rows), 0, 'the remaining rows are the same elements');
  const flipping = await page.evaluate(() => document.getAnimations().filter(a => a.effect?.target?.dataset?.key?.startsWith('f-') || a.effect?.target?.parentElement === document.body).length);
  assert.ok(flipping >= 1, 'FLIP / ghost animation is running');
  await context.close();
});

test('typing in a search box keeps focus and text while the screen refreshes (diffing, not repainting)', async () => {
  const { page, context } = await newApp(env); await onboard(page);
  await go(page, '#/home/journal');
  await page.click('#j-q'); await page.keyboard.type('hola mundo', { delay: 20 });
  assert.equal(await page.inputValue('#j-q'), 'hola mundo');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'j-q');
  await context.close();
});

test('bottom sheet: opens with a slide-up, can be dragged down to dismiss, and springs back when released early', async () => {
  const { page, context } = await newApp(env); await onboard(page);
  const cdp = await context.newCDPSession(page);
  const touch = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: 195, y }] });
  const panelY = () => page.evaluate(() => document.querySelector('#sheet .panel').getBoundingClientRect().top);

  await page.click('[data-act=add-weight]'); await page.waitForTimeout(700);
  const top = await panelY();
  // short drag, release → springs back
  await touch('touchStart', top + 14); for (let i = 1; i <= 5; i++) await touch('touchMove', top + 14 + i * 10); await touch('touchEnd');
  await page.waitForTimeout(900);
  assert.ok(await page.isVisible('#sheet .panel')); assert.ok(Math.abs((await panelY()) - top) < 2, 'returned to its resting place');
  // long drag → dismissed
  await touch('touchStart', top + 14); for (let i = 1; i <= 12; i++) { await touch('touchMove', top + 14 + i * 25); await page.waitForTimeout(8); } 
  const during = await panelY(); assert.ok(during > top + 100, 'panel follows the finger');
  await touch('touchEnd'); await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => document.querySelector('#sheet').classList.contains('open')), false);
  await context.close();
});

test('screen transitions use the View Transitions API when the browser has it', async () => {
  const { page, context } = await newApp(env); await onboard(page);
  const has = await page.evaluate(() => !!document.startViewTransition);
  if (!has) { await context.close(); return; }
  await page.evaluate(() => { window.__vt = 0; const o = document.startViewTransition.bind(document); document.startViewTransition = f => { window.__vt++; return o(f); }; });
  await go(page, '#/progress'); assert.equal(await page.evaluate(() => window.__vt), 1);
  await page.click('[data-act=add-water]').catch(() => { });                           // a same-screen refresh must not start a transition
  assert.equal(await page.evaluate(() => window.__vt), 1);
  await context.close();
});

test('onboarding: choosing an objective updates in place (same cards, no entrance replay)', async () => {
  const { page, context } = await newApp(env);
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelectorAll('#main .card, #main .title, #main input').forEach(e => { e.__m = true; }));
  await page.click('[data-act=ob-obj][data-v=fatLoss]'); await page.waitForTimeout(100);
  const fresh = await page.evaluate(() => document.getAnimations().filter(a => a.animationName === 'rise' && a.currentTime < 90).length);
  assert.equal(fresh, 0, 'no entrance animation (re)started');
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('#main .card, #main .title, #main input')].filter(e => !e.__m).length), 0);
  assert.equal(await page.evaluate(() => document.querySelector('[data-v=fatLoss]').classList.contains('sel')), true);
  await context.close();
});
