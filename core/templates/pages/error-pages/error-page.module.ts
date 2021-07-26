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

import { ErrorPageComponent } from './error-page.component';
import { SharedComponentsModule } from 'components/shared-component.module';
import { ErrorPageRootComponent } from './error-page-root.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';


// Config for ToastrModule (helps in flashing messages and alerts).
const toastrConfig = {
  allowHtml: false,
  iconClasses: {
    error: 'toast-error',
    info: 'toast-info',
    success: 'toast-success',
    warning: 'toast-warning'
  },
  positionClass: 'toast-bottom-right',
  messageClass: 'toast-message',
  progressBar: false,
  tapToDismiss: true,
  titleClass: 'toast-title'
};


@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    ErrorPageComponent,
    ErrorPageRootComponent,
  ],
  entryComponents: [
    ErrorPageComponent,
    ErrorPageRootComponent,
  ],
  bootstrap: [
    ErrorPageRootComponent
  ]
})
export class ErrorPageModule {}
