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
 * @fileoverview Module for the graph interaction components.
 */
import 'core-js/es7/reflect';
import 'zone.js';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GraphVizComponent } from './directives/graph-viz.component';
import { InteractiveGraphInput } from './directives/oppia-interactive-graph-input.component';
import { ResponseGraphInput } from './directives/oppia-response-graph-input.component';
import { ShortResponseGraphInput } from './directives/oppia-short-response-graph-input.component';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'modules/material.module';
import { DirectivesModule } from 'directives/directives.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    DirectivesModule,
    SharedPipesModule,
    TranslateModule
  ],
  declarations: [
    InteractiveGraphInput,
    GraphVizComponent,
    ResponseGraphInput,
    ShortResponseGraphInput
  ],
  entryComponents: [
    InteractiveGraphInput,
    GraphVizComponent,
    ResponseGraphInput,
    ShortResponseGraphInput
  ],
  exports: [
    InteractiveGraphInput,
    GraphVizComponent,
    ResponseGraphInput,
    ShortResponseGraphInput
  ],
})

export class GraphInputInteractionModule { }
