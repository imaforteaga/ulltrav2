// The logo ships as a real file so the service worker can cache it and the HTML stays small.
export const LOGO = new URL('../../assets/logo.png', import.meta.url).href;
