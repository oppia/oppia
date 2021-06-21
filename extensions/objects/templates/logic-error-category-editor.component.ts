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
 * @fileoverview Component for logic error category editor.
 */

// Every editor component should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

interface ErrorCategory {
  name: string,
  humanReadable: string
}

@Component({
  selector: 'logic-error-category-editor',
  templateUrl: './logic-error-category-editor.component.html',
  styleUrls: []
})
export class LogicErrorCategoryEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  @Input() value!: ErrorCategory;
  @Output() valueChanged = new EventEmitter();

  get category(): ErrorCategory {
    return this.value;
  }
  set category(value: ErrorCategory) {
    this.value = value;
    this.valueChanged.emit(this.value);
  }
  errorCategories: ErrorCategory[] = [
    {
      name: 'parsing',
      humanReadable: 'Unparseable'
    }, {
      name: 'typing',
      humanReadable: 'Ill-typed'
    }, {
      name: 'line',
      humanReadable: 'Incorrect line'
    }, {
      name: 'layout',
      humanReadable: 'Wrong indenting'
    }, {
      name: 'variables',
      humanReadable: 'Variables error'
    }, {
      name: 'logic',
      humanReadable: 'Invalid deduction'
    }, {
      name: 'target',
      humanReadable: 'Target not proved'
    }, {
      name: 'mistake',
      humanReadable: 'Unspecified'
    }];
  alwaysEditable: boolean = true;
  ngOnInit(): void {
    if (!this.value) {
      this.category = this.errorCategories[0];
    }
  }
}
angular.module('oppia').directive(
  'logicErrorCategoryEditor', downgradeComponent({
    component: LogicErrorCategoryEditorComponent
  }) as angular.IDirectiveFactory);
