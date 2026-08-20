(window as any).global = window;

import { installWebMcpPolyfill } from 'ng-webmcp/testing';
installWebMcpPolyfill();

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
