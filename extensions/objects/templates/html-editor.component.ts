// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for HTML editor.
 */

// Every editor component should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.
//
// This component is based on the UnicodeString directive.
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'html-editor',
  templateUrl: './html-editor.component.html',
  styleUrls: []
})
export class HtmlEditorComponent {
  @Input() modalId: symbol;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  schema = {
    type: 'html'
  };

  updateValue(value: string): void {
    this.value = value;
    this.valueChanged.emit(value);
  }
}

angular.module('oppia').directive('htmlEditor', downgradeComponent({
  component: HtmlEditorComponent
}) as angular.IDirectiveFactory);
