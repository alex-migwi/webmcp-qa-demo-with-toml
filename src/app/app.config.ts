import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideWebmcp } from 'ng-webmcp';
import { provideWebMcpTomlLoader } from '../webmcp-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideWebmcp({ fallbackBehavior: 'warn' }),
    provideWebMcpTomlLoader(), // <-- Only line needed
  ]
};
