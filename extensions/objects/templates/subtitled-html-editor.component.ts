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
 * @fileoverview Component for Subtitled Html editor.
 */

import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

interface SubtitledHtmlEditorSchema {
  type: string;
  'ui_config': unknown | {}
}

@Component({
  selector: 'subtitled-html-editor',
  templateUrl: './subtitled-html-editor.component.html'
})
export class SubtitledHtmlEditorComponent implements OnInit {
  @Input() modalId: symbol;
  @Input() schema;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  SCHEMA: SubtitledHtmlEditorSchema;

  constructor(private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    const uiConfig = (
      this.schema.replacement_ui_config ? this.schema.replacement_ui_config : {}
    );
    this.SCHEMA = {
      type: 'html',
      ui_config: uiConfig
    };
  }

  getSchema(): SubtitledHtmlEditorSchema {
    return this.SCHEMA;
  }

  updateValue(newValue: unknown): void {
    if (this.value._html === newValue) {
      return;
    }
    this.value._html = newValue;
    this.valueChanged.emit(this.value);
    this.changeDetectorRef.detectChanges();
  }
}

angular.module('oppia').directive('subtitledHtmlEditor', downgradeComponent({
  component: SubtitledHtmlEditorComponent
}) as angular.IDirectiveFactory);
