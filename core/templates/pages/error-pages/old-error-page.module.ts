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
 * @fileoverview Module for the error page. This module has not
 * been migrated to angular router.
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';

import { ErrorPageComponent } from './error-page.component';
import { ErrorPageRootComponent } from './error-page-root.component';
import { ErrorPageRoutingModule } from './old-error-page-routing.module';
import { ErrorPageSharedModule } from './error-page-shared.module';

// TODO (#19154): Remove this module in favor of error-page-migrated.module.ts
// once angular migration is complete.

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    ErrorPageRoutingModule,
    ErrorPageSharedModule,
  ],
  entryComponents: [
    ErrorPageComponent,
    ErrorPageRootComponent,
  ],
  bootstrap: [
    ErrorPageRootComponent
  ],
  providers: [
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ]
})
export class OldErrorPageModule {}
