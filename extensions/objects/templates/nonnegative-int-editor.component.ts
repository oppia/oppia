// Copyright 2012 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for non-negative int editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';

interface NonnegativeIntSchema {
  type: string;
  validators: {
    id: string;
    min_value?: number;
  }[];
}
@Component({
  selector: 'nonnegative-int-editor',
  templateUrl: './nonnegative-int-editor.component.html',
})
export class NonnegativeIntEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  @Input() value!: number;

  @Output() valueChanged: EventEmitter<number> = new EventEmitter<number>();
  SCHEMA: NonnegativeIntSchema = {
    type: 'int',
    validators: [
      {
        id: 'is_at_least',
        min_value: 0,
      },
      {
        id: 'is_integer',
      },
    ],
  };

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.value) {
      this.value = 0;
      this.valueChanged.emit(this.value);
    }
  }

  getSchema(): NonnegativeIntSchema {
    return this.SCHEMA;
  }

  updateValue(value: number): void {
    if (value === this.value) {
      return;
    }
    this.value = value;
    this.valueChanged.emit(this.value);
    this.changeDetectorRef.detectChanges();
  }
}
