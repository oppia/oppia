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

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import 'core-js/es7/reflect';
import 'zone.js';
import {CodemirrorModule} from '@ctrl/ngx-codemirror';
import {CodemirrorMergeviewComponent} from './codemirror-mergeview.component';
import {CodeMirrorComponent} from './codemirror.component';
import {FormsModule} from '@angular/forms';

@NgModule({
  imports: [CommonModule, CodemirrorModule, FormsModule],
  declarations: [CodemirrorMergeviewComponent, CodeMirrorComponent],
  entryComponents: [CodemirrorMergeviewComponent, CodeMirrorComponent],
  exports: [CodemirrorMergeviewComponent, CodeMirrorComponent],
})
export class CodeMirrorModule {}
