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

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';


// Modules.
import { BrowserModule, HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './routing/app.routing.module';

// Components.
import { OppiaRootComponent } from './oppia-root.component';

// Miscellaneous.
import { platformFeatureInitFactory, PlatformFeatureService } from 'services/platform-feature.service';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { CookieModule } from 'ngx-cookie';
import { ToastrModule } from 'ngx-toastr';
import { AngularFireAuth, AngularFireAuthModule, USE_EMULATOR } from '@angular/fire/auth';
import { AngularFireModule } from '@angular/fire';
import { AuthService } from 'services/auth.service';
import firebase from 'firebase/app';
import 'firebase/auth';
import * as hammer from 'hammerjs';

class FirebaseErrorFilterHandler extends ErrorHandler {
  // AngularFire throws duplicate errors because it uses setTimeout() to manage
  // promises internally. Errors thrown from those setTimeout() calls are not
  // accessible to our code. Because of this, even though LoginPageComponent
  // catches errors thrown by AngularFire, their duplicates are treated as
  // "Unhandled Promise Rejections" and result in top-level error messages.
  //
  // To prevent these errors from interfering with end-to-end tests and from
  // polluting the server, we ignore the following list of EXPECTED error codes.
  private static readonly EXPECTED_ERROR_CODES = [
    // Users pending deletion have their Firebase accounts disabled. When they
    // try to sign in anyway, we redirect them to the /pending-account-deletion
    // page.
    'auth/user-disabled',
    // In emulator mode we use signInWithEmailAndPassword() and, if that throws
    // an 'auth/user-not-found' error, createUserWithEmailAndPassword() for
    // convenience. In production mode we use signInWithRedirect(), which
    // doesn't throw 'auth/user-not-found' because it handles both signing in
    // and creating users in the same way.
    'auth/user-not-found',
  ];

  handleError(error: firebase.auth.Error): void {
    if (FirebaseErrorFilterHandler.EXPECTED_ERROR_CODES.includes(error.code)) {
      return;
    }
    super.handleError(error);
  }
}

// Config for ToastrModule (helps in flashing messages and alerts).
export const toastrConfig = {
  allowHtml: false,
  iconClasses: {
    error: 'toast-error',
    info: 'toast-info',
    success: 'toast-success',
    warning: 'toast-warning'
  },
  positionClass: 'toast-bottom-right',
  messageClass: 'toast-message protractor-test-toast-message',
  progressBar: false,
  tapToDismiss: true,
  titleClass: 'toast-title'
};

export class MyHammerConfig extends HammerGestureConfig {
  overrides = {
    swipe: { direction: hammer.DIRECTION_HORIZONTAL },
    pinch: { enable: false },
    rotate: { enable: false },
  };

  options = {
    cssProps: {
      userSelect: true
    }
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
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    OppiaRootComponent,
  ],
  entryComponents: [
    OppiaRootComponent,
  ],
  providers: [
    AngularFireAuth,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: platformFeatureInitFactory,
      deps: [PlatformFeatureService],
      multi: true
    },
    {
      provide: USE_EMULATOR,
      useValue: AuthService.firebaseEmulatorConfig
    },
    {
      provide: ErrorHandler,
      useClass: FirebaseErrorFilterHandler,
    },
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    }
  ],
  bootstrap: [OppiaRootComponent]
})
export class AppModule {}
