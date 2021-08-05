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

import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { SharedComponentsModule } from 'components/shared-component.module';
import { LoginPageComponent } from 'pages/login-page/login-page.component';
import { LoginPageRootComponent } from './login-page-root.component';
import { CommonModule } from '@angular/common';
import { LoginPageRoutingModule } from './login-page-routing.module';

@NgModule({
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    SharedComponentsModule,
    LoginPageRoutingModule
  ],
  declarations: [
    LoginPageComponent,
    LoginPageRootComponent,
  ],
  entryComponents: [
    LoginPageComponent,
    LoginPageRootComponent,
  ]
})
export class LoginPageModule {}
