// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Module for the about page.
 */

import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';
import {APP_INITIALIZER, NgModule} from '@angular/core';

// Modules.
import {
  BrowserModule,
  HammerGestureConfig,
  HAMMER_GESTURE_CONFIG,
} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './routing/app.routing.module';

// Components.
import {OppiaRootComponent} from './oppia-root.component';

// Miscellaneous.
import {
  platformFeatureInitFactory,
  PlatformFeatureService,
} from 'services/platform-feature.service';
import {RequestInterceptor} from 'services/request-interceptor.service';
import {CookieModule} from 'ngx-cookie';
import {ToastrModule} from 'ngx-toastr';
import {
  AngularFireAuth,
  AngularFireAuthModule,
  USE_EMULATOR,
} from '@angular/fire/auth';
import {AngularFireModule} from '@angular/fire';
import {AuthService} from 'services/auth.service';
// This throws "TS2307". We need to
// suppress this error because hammer come from hammerjs
// dependency. We can't import it directly.
// @ts-ignore
import * as hammer from 'hammerjs';
import {AppErrorHandlerProvider} from './app-error-handler';
import {I18nModule} from 'i18n/i18n.module';

// Config for ToastrModule (helps in flashing messages and alerts).
export const toastrConfig = {
  allowHtml: false,
  iconClasses: {
    error: 'toast-error',
    info: 'toast-info',
    success: 'toast-success',
    warning: 'toast-warning',
  },
  positionClass: 'toast-bottom-right',
  messageClass: 'toast-message e2e-test-toast-message',
  progressBar: false,
  tapToDismiss: true,
  titleClass: 'toast-title',
};

export class MyHammerConfig extends HammerGestureConfig {
  overrides = {
    swipe: {direction: hammer.DIRECTION_HORIZONTAL},
    pinch: {enable: false},
    rotate: {enable: false},
  };

  options = {
    cssProps: {
      userSelect: true,
    },
  };
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CookieModule.forRoot(),
    HttpClientModule,
    AngularFireModule.initializeApp(AuthService.firebaseConfig),
    AngularFireAuthModule,
    AppRoutingModule,
    I18nModule,
    ToastrModule.forRoot(toastrConfig),
  ],
  declarations: [OppiaRootComponent],
  entryComponents: [OppiaRootComponent],
  providers: [
    AngularFireAuth,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: platformFeatureInitFactory,
      deps: [PlatformFeatureService],
      multi: true,
    },
    {
      provide: USE_EMULATOR,
      useValue: AuthService.firebaseEmulatorConfig,
    },
    AppErrorHandlerProvider,
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig,
    },
  ],
  bootstrap: [OppiaRootComponent],
})
export class AppModule {}
