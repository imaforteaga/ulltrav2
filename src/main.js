import './app/register.js';
import { S } from './state/store.js';
import { loadState, installPersistenceHooks } from './state/storage.js';
import { applyTheme } from './ui/theme.js';
import { installActions } from './ui/actions.js';
import { closeSheet } from './ui/sheet.js';
import { configureRouter, render } from './ui/render.js';
import { subscribe } from './state/store.js';
import { $ } from './lib/dom.js';
import { ROUTES, TABS, ONBOARDING } from './app/routes.js';
import { syncMilestones } from './features/milestones/milestones.js';
import { hydratePhotos } from './features/progress/photos.js';
import { remTick } from './features/reminders/reminders.js';
import { applyRecurring } from './domain/finance.js';
import { todayKey } from './lib/dates.js';
import { save } from './state/store.js';

/** Creates this month's recurring expenses (rent, subscriptions…) once their day has come. */
const recurringTick = () => { if (S.profile && S.fin && S.fin.recurring && S.fin.recurring.length && applyRecurring(S, todayKey())) { save(); render(true); } };

async function boot() {
  installPersistenceHooks();
  await loadState();
  subscribe(applyTheme); applyTheme();
  if (S.profile) syncMilestones();

  configureRouter({ routes: ROUTES, tabs: TABS, onboarding: ONBOARDING, afterRender: hydratePhotos });
  installActions();
  window.addEventListener('hashchange', () => { closeSheet(); render(); });
  new MutationObserver(() => hydratePhotos($('#sheet'))).observe($('#sheet'), { childList: true });   // photos inside sheets too

  recurringTick();
  render();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) recurringTick(); });
  setTimeout(remTick, 1500);
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
}
boot();
