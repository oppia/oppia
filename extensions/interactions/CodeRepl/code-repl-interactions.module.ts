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
 * @fileoverview Module for the CodeRepl interaction components.
 */

import 'core-js/es7/reflect';
import 'zone.js';

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {CodemirrorModule} from '@ctrl/ngx-codemirror';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {InteractiveCodeReplComponent} from './directives/oppia-interactive-code-repl.component';
import {DirectivesModule} from 'directives/directives.module';
import {SharedPipesModule} from 'filters/shared-pipes.module';
import {TranslateModule} from '@ngx-translate/core';
import {ResponseCodeReplComponent} from './directives/oppia-response-code-repl.component';
import {ShortResponseCodeRepl} from './directives/oppia-short-response-code-repl.component';

@NgModule({
  imports: [
    CommonModule,
    CodemirrorModule,
    DirectivesModule,
    FormsModule,
    MatButtonModule,
    SharedPipesModule,
    TranslateModule,
  ],
  declarations: [
    InteractiveCodeReplComponent,
    ResponseCodeReplComponent,
    ShortResponseCodeRepl,
  ],
  entryComponents: [
    InteractiveCodeReplComponent,
    ResponseCodeReplComponent,
    ShortResponseCodeRepl,
  ],
  exports: [
    InteractiveCodeReplComponent,
    ResponseCodeReplComponent,
    ShortResponseCodeRepl,
  ],
})
export class CodeReplInteractionModule {}
