// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for integers.
 */
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SchemaFormSubmittedService } from 'services/schema-form-submitted.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';

@Component({
  selector: 'schema-based-int-editor',
  templateUrl: './schema-based-int-editor.directive.html',
  styleUrls: []
})
export class SchemaBasedIntEditorComponent implements OnInit {
  @Input() localValue;
  @Output() localValueChange = new EventEmitter();
  @Input() disabled;
  @Input() notRequired;
  @Input() validators;
  @Input() labelForFocusTarget;
  @Output() inputBlur = new EventEmitter<void>();
  @Output() inputFocus = new EventEmitter<void>();
  constructor(
    private focusManagerService: FocusManagerService,
    private schemaFormSubmittedService: SchemaFormSubmittedService
  ) { }

  onKeypress(evt: KeyboardEvent): void {
    if (evt.keyCode === 13) {
      this.schemaFormSubmittedService.onSubmittedSchemaBasedForm.emit();
    }
  }

  ngOnInit(): void {
    if (this.localValue === undefined) {
      this.localValue = 0;
    }
    // So that focus is applied after all the functions in
    // main thread have executed.
    setTimeout(() => {
      this.focusManagerService.setFocusWithoutScroll(this.labelForFocusTarget);
    }, 50);
  }
}

require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require('services/schema-form-submitted.service.ts');
require('services/stateful/focus-manager.service.ts');

angular.module('oppia').directive('schemaBasedIntEditor', downgradeComponent({
  component: SchemaBasedIntEditorComponent
}) as angular.IDirectiveFactory);
