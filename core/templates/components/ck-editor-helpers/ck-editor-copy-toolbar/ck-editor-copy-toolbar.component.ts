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
 * @fileoverview Ck editor copy toolbar component.
 */

import {Component, Inject} from '@angular/core';
import {DOCUMENT} from '@angular/common';

import {CkEditorCopyContentService} from 'components/ck-editor-helpers/ck-editor-copy-content.service';

@Component({
  selector: 'ck-editor-copy-toolbar',
  templateUrl: './ck-editor-copy-toolbar.component.html',
})
export class CkEditorCopyToolbarComponent {
  constructor(
    public ckEditorCopyContentService: CkEditorCopyContentService,
    @Inject(DOCUMENT) private document: Document
  ) {
    ckEditorCopyContentService.copyModeActive = false;
  }

  toggleToolActive(): void {
    this.ckEditorCopyContentService.toggleCopyMode();
    let element = this.document.querySelectorAll(
      '.oppia-rte-editor'
    ) as NodeListOf<HTMLElement>;

    if (this.ckEditorCopyContentService.copyModeActive) {
      this.document.body.style.cursor = 'copy';
      element.forEach(editor => {
        editor.focus();
      });
    } else {
      this.document.body.style.cursor = '';
      element.forEach(editor => {
        editor.blur();
      });
    }
  }

  ngOnDestroy(): void {
    this.document.body.style.cursor = '';
  }
}
