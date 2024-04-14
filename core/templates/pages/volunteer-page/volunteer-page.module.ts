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
 * @fileoverview Module for the volunteer page.
 */

import {NgModule} from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {VolunteerPageComponent} from './volunteer-page.component';
import {SharedComponentsModule} from 'components/shared-component.module';
import {VolunteerPageRootComponent} from './volunteer-page-root.component';
import {CommonModule} from '@angular/common';
import {VolunteerPageRoutingModule} from './volunteer-page-routing.module';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    VolunteerPageRoutingModule,
    NgbModule,
  ],
  declarations: [VolunteerPageComponent, VolunteerPageRootComponent],
  entryComponents: [VolunteerPageComponent, VolunteerPageRootComponent],
})
export class VolunteerPageModule {}
