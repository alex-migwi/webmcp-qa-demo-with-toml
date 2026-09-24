(window as any).global = window;

import { installWebMcpPolyfill } from 'ng-webmcp/testing';

const useWebMcpPolyfill = new URLSearchParams(window.location.search).has('webmcpPolyfill');
if (useWebMcpPolyfill) {
  installWebMcpPolyfill();
}

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
