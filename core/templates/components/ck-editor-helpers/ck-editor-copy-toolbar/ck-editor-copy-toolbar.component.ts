// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview About page component.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'ck-editor-copy-toolbar',
  templateUrl: './ck-editor-copy-toolbar.component.html'
})
export class CkEditorCopyToolbar {
  @Input() toolActive = false;
  @Output() setToolActive = new EventEmitter<boolean>();

  toggleToolActive() {
    this.setToolActive.emit(!this.toolActive);
    if (!this.toolActive) {
      document.body.style.cursor = 'copy';

      document.querySelectorAll('.oppia-rte-editor')
        .forEach((editor: HTMLElement) => {
          editor.focus();
        });
    } else {
      document.body.style.cursor = 'auto';
      document.querySelectorAll('.oppia-rte-editor')
        .forEach((editor: HTMLElement) => {
          editor.blur();
        });
    }
  }
}

angular.module('oppia').directive(
  'ckEditorCopyToolbar',
  downgradeComponent({component: CkEditorCopyToolbar}));
