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
 * @fileoverview Module for the partnerships page.
 */

import { NgModule } from '@angular/core';
import { PartnershipsPageComponent } from './partnerships-page.component';
import { SharedComponentsModule } from 'components/shared-component.module';
import { PartnershipsPageRootComponent } from
  './partnerships-page-root.component';
import { CommonModule } from '@angular/common';
import { PartnershipsPageRoutingModule } from './partnerships-page-routing.module';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    PartnershipsPageRoutingModule,
    NgbCarouselModule
  ],
  declarations: [
    PartnershipsPageComponent,
    PartnershipsPageRootComponent
  ],
  entryComponents: [
    PartnershipsPageComponent,
    PartnershipsPageRootComponent
  ]
})
export class PartnershipsPageModule {}
