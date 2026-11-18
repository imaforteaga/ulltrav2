import { ACT } from './actions.js';

ACT.go = el => { location.hash = el.dataset.v; };

ACT.back = () => history.length > 1 ? history.back() : (location.hash = '#/home');
