import 'core-js/es7/reflect';
import 'zone.js';
import 'angular';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { LoginPageModule } from './login-page.module';
platformBrowserDynamic().bootstrapModule(LoginPageModule).catch(
  err => console.error(err));
