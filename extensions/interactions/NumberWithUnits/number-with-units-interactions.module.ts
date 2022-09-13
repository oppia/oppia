// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the number with units components.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HelpModalNumberWithUnitsComponent } from './directives/oppia-help-modal-number-with-units.component';
import { InteractiveNumberWithUnitsComponent } from './directives/oppia-interactive-number-with-units.component';
import { ResponseNumberWithUnitsComponent } from './directives/oppia-response-number-with-units.component';
import { ShortResponseNumberWithUnitsComponent } from './directives/oppia-short-response-number-with-units.component';
import { SharedComponentsModule } from 'components/shared-component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedComponentsModule,
    TranslateModule,
  ],
  declarations: [
    HelpModalNumberWithUnitsComponent,
    InteractiveNumberWithUnitsComponent,
    ResponseNumberWithUnitsComponent,
    ShortResponseNumberWithUnitsComponent,
  ],
  entryComponents: [
    HelpModalNumberWithUnitsComponent,
    InteractiveNumberWithUnitsComponent,
    ResponseNumberWithUnitsComponent,
    ShortResponseNumberWithUnitsComponent,
  ],
  exports: [
    HelpModalNumberWithUnitsComponent,
    InteractiveNumberWithUnitsComponent,
    ResponseNumberWithUnitsComponent,
    ShortResponseNumberWithUnitsComponent,
  ],
})

export class NumberWithUnitsInteractionModule { }
