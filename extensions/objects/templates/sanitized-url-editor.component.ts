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
 * @fileoverview Directive for sanitized URL editor.
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

interface SanitizedUrlSchema {
  type: string;
  validators: [
    {
      id: string;
    },
    {
      id: string;
      regexPattern: string;
    }
  ];
  'ui_config': {
    placeholder: string;
  };
}
@Component({
  selector: 'sanitized-url-editor',
  templateUrl: './sanitized-url-editor.component.html',
  styleUrls: []
})
export class SanitizedUrlEditorComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  // TODO(#13015): Remove use of unknown as a type.
  // The property 'value' is dependent on another property, 'localValue', from
  // 'schema-based-editor'. Most components using 'localValue' are currently in
  // AngularJS, so its type cannot be determined for now.
  @Input() value: unknown;
  @Output() valueChanged = new EventEmitter();
  schema: SanitizedUrlSchema = {
    type: 'unicode',
    validators: [
      {
        id: 'is_nonempty'
      },
      {
        id: 'is_regex_matched',
        regexPattern: '(^https:\\/\\/.*)|(^(?!.*:\\/\\/)(.*))'
      }
    ],
    ui_config: {
      placeholder: 'https://www.example.com'
    }
  };

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  getSchema(): SanitizedUrlSchema {
    return this.schema;
  }

  updateValue(newValue: unknown): void {
    if (this.value === newValue) {
      return;
    }
    this.value = newValue;
    this.valueChanged.emit(this.value);
    this.changeDetectorRef.detectChanges();
  }
}
angular.module('oppia').directive('sanitizedUrlEditor', downgradeComponent({
  component: SanitizedUrlEditorComponent
}) as angular.IDirectiveFactory);
