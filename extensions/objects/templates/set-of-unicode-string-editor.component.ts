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
 * @fileoverview Component for set of unicode string editor.
 */

// Every editor component should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'set-of-unicode-string-editor',
  templateUrl: './list-editor.component.html',
  styleUrls: []
})
export class SetOfUnicodeStringEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  // TODO(#13015): Remove use of unknown as a type.
  // The property 'value' is dependent on another property, 'localValue', from
  // 'schema-based-editor'. Most components using 'localValue' are currently in
  // AngularJS, so its type cannot be determined for now.
  @Input() value: unknown;
  @Output() valueChanged = new EventEmitter();
  SCHEMA = {
    type: 'list',
    items: {
      type: 'unicode'
    },
    validators: [{
      id: 'is_uniquified'
    }]
  };

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.value) {
      this.value = [];
      this.valueChanged.emit(this.value);
    }
  }

  getSchema(): unknown {
    return this.SCHEMA;
  }

  updateValue(value: unknown): void {
    if (this.value === value) {
      return;
    }
    this.value = value;
    this.valueChanged.emit(this.value);
    this.changeDetectorRef.detectChanges();
  }
}

angular.module('oppia').directive(
  'setOfUnicodeStringEditor', downgradeComponent({
    component: SetOfUnicodeStringEditorComponent
  }) as angular.IDirectiveFactory);
