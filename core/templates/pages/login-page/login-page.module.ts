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
 * @fileoverview Module for the login page.
 */

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeComponent, downgradeModule } from '@angular/upgrade/static';
import firebase from 'firebase/app';

import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { SharedComponentsModule } from 'components/shared-component.module';
import { LoginPageComponent } from 'pages/login-page/login-page.component';
import { platformFeatureInitFactory, PlatformFeatureService } from 'services/platform-feature.service';
import { RequestInterceptor } from 'services/request-interceptor.service';

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

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    MatAutocompleteModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    SharedComponentsModule,
  ],
  declarations: [
    LoginPageComponent,
    OppiaAngularRootComponent,
  ],
  entryComponents: [
    LoginPageComponent,
    OppiaAngularRootComponent,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true,
    },
    {
      provide: ErrorHandler,
      useClass: FirebaseErrorFilterHandler,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: platformFeatureInitFactory,
      deps: [PlatformFeatureService],
      multi: true,
    },
  ],
})
class LoginPageModule {
  ngDoBootstrap() {}
}

declare var angular: ng.IAngularStatic;

angular.module('oppia').requires.push(
  downgradeModule(async(providers) => {
    return platformBrowserDynamic(providers).bootstrapModule(LoginPageModule);
  }));

angular.module('oppia').directive('oppiaAngularRoot', downgradeComponent({
  component: OppiaAngularRootComponent,
}) as angular.IDirectiveFactory);
