// Copyright 2023 The Oppia Authors. All Rights Reserved.
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

import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {SharedComponentsModule} from 'components/shared-component.module';
import {ToastrModule} from 'ngx-toastr';
import {ErrorPageComponent} from './error-page.component';
import {ErrorPageRootComponent} from './error-page-root.component';
import {toastrConfig} from 'pages/oppia-root/app.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    SharedComponentsModule,
    RouterModule.forChild([
      {
        path: '',
        component: ErrorPageRootComponent,
      },
    ]),
    TranslateModule,
    ToastrModule.forRoot(toastrConfig),
  ],
  declarations: [ErrorPageComponent, ErrorPageRootComponent],
  entryComponents: [ErrorPageComponent, ErrorPageRootComponent],
})
export class ErrorPageModule {}
