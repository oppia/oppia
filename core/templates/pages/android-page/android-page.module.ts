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
 * @fileoverview Module for the Android page.
 */

import { NgModule } from '@angular/core';
import { AndroidPageComponent } from './android-page.component';
import { SharedComponentsModule } from 'components/shared-component.module';
import { AndroidPageRootComponent } from './android-page-root.component';
import { CommonModule } from '@angular/common';
import { AndroidPageRoutingModule } from './android-page-routing.module';
import { Error404PageModule } from 'pages/error-pages/error-404/error-404-page.module';
import { I18nModule } from 'i18n/i18n.module';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    AndroidPageRoutingModule,
    Error404PageModule,
    I18nModule,
  ],
  declarations: [
    AndroidPageComponent,
    AndroidPageRootComponent
  ],
  entryComponents: [
    AndroidPageComponent,
    AndroidPageRootComponent
  ]
})
export class AndroidPageModule {}
