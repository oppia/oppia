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

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {NgForm} from '@angular/forms';
import {SchemaDefaultValue} from 'services/schema-default-value.service';
import {VALIDATION_STATUS_INVALID} from 'utility/forms';

interface SanitizedUrlSchema {
  type: string;
  validators: [
    {
      id: string;
    },
    {
      id: string;
      regexPattern: string;
    },
  ];
  ui_config: {
    placeholder: string;
  };
}
@Component({
  selector: 'sanitized-url-editor',
  templateUrl: './sanitized-url-editor.component.html',
  styleUrls: [],
})
export class SanitizedUrlEditorComponent implements AfterViewInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  @ViewChild('schemaBasedEditorForm') form!: NgForm;
  @Input() value!: SchemaDefaultValue;
  @Output() valueChanged = new EventEmitter();
  @Output() validityChange = new EventEmitter();
  schema: SanitizedUrlSchema = {
    type: 'unicode',
    validators: [
      {
        id: 'is_nonempty',
      },
      {
        id: 'is_regex_matched',
        regexPattern: '(^https:\\/\\/.*)|(^(?!.*:\\/\\/)(.*))',
      },
    ],
    ui_config: {
      placeholder: 'https://www.example.com',
    },
  };

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  getSchema(): SanitizedUrlSchema {
    return this.schema;
  }

  updateValue(newValue: SchemaDefaultValue): void {
    if (this.value === newValue) {
      return;
    }
    this.value = newValue;
    this.valueChanged.emit(this.value);
    this.changeDetectorRef.detectChanges();
  }

  ngAfterViewInit(): void {
    // The 'statusChanges' property is an Observable that emits an event every
    // time the status of the control changes. The NgForm class, which our
    // component is using, initializes 'this.form' (which is an instance of
    // FormGroup) in its constructor. Since FormGroup extends AbstractControl
    // (and indirectly AbstractControlDirective), it also has the
    // 'statusChanges' property. The 'control' getter in NgForm is overridden to
    // return 'this.form'. Thus, whenever we reference 'statusChanges' in our
    // component, it is referring to 'statusChanges' of 'this.form'.

    // Because 'this.form' is guaranteed to be initialized in the NgForm
    // constructor before any lifecycle methods of our component are run, we can
    // safely use a non-null assertion operator on 'statusChanges'. This is
    // because we are confident that 'statusChanges' will not be null when we
    // use it in our component.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.form.statusChanges!.subscribe(validationStatus => {
      if (validationStatus === VALIDATION_STATUS_INVALID) {
        this.validityChange.emit({validUrl: false});
      } else {
        this.validityChange.emit({validUrl: true});
      }
    });
  }
}
