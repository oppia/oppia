import 'pages/common-imports';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { LighweightAppModule } from 'pages/lightweight-oppia-root/app.module';


enableProdMode();


platformBrowserDynamic().bootstrapModule(LighweightAppModule).catch(
  (err) => console.error(err)
);

// This prevents angular pages to cause side effects to hybrid pages.
// TODO(#13080): Remove window.name statement from import.ts files
// after migration is complete.
window.name = '';
