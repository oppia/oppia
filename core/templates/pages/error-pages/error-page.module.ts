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

import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { ErrorPageComponent } from './error-page.component';
import { ErrorPageRootComponent } from './error-page-root.component';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrModule } from 'ngx-toastr';
import { SharedComponentsModule } from 'components/shared-component.module';
import { toastrConfig } from 'pages/oppia-root/app.module';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule.forChild([
      {
        path: '',
        component: ErrorPageRootComponent
      },
    ]),
    SharedComponentsModule,
    TranslateModule,
    ToastrModule.forRoot(toastrConfig),
  ],
  entryComponents: [ErrorPageComponent, ErrorPageRootComponent],
  bootstrap: [ErrorPageRootComponent],
  declarations: [ErrorPageComponent, ErrorPageRootComponent],
  exports: [ErrorPageComponent, ErrorPageRootComponent],
})
export class ErrorPageModule {}
