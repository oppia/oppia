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
 * @fileoverview Module for the contact page.
 */

import { NgModule } from '@angular/core';
import { SharedComponentsModule } from 'components/shared-component.module';
import { ContactPageComponent } from './contact-page.component';
import { ContactPageRootComponent } from './contact-page-root.component';
import { CommonModule } from '@angular/common';
import { ContactPageRoutingModule } from './contact-page-routing.module';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    ContactPageRoutingModule
  ],
  declarations: [
    ContactPageComponent,
    ContactPageRootComponent
  ],
  entryComponents: [
    ContactPageComponent,
    ContactPageRootComponent
  ]
})
export class ContactPageModule {}
