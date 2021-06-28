// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the error page.
 */

import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { ErrorPageComponent } from './error-page.component';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { SharedComponentsModule } from 'components/shared-component.module';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { ErrorPageRootComponent } from './error-page-root.component';
import { ErrorPageRoutingModule } from './error-page-routing.module';

@NgModule({
  imports: [
    ErrorPageRoutingModule,
    SharedComponentsModule
  ],
  declarations: [
    ErrorPageComponent,
    ErrorPageRootComponent,
    OppiaAngularRootComponent
  ],
  entryComponents: [
    ErrorPageComponent,
    ErrorPageRootComponent,
    OppiaAngularRootComponent
  ],
  bootstrap: [ErrorPageRootComponent]
})
export class ErrorPageModule {}
