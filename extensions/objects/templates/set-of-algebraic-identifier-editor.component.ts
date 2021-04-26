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
 * @fileoverview Component for set of algebraic identifier editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

import { ChangeDetectorRef } from '@angular/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { GuppyInitializationService } from 'services/guppy-initialization.service';

interface SetOfAlgebraicIdentifierEditorSchema {
  type: 'list',
  items: {
    type: 'unicode',
    choices: string[]
  },
  validators: [{
    id: 'is_uniquified'
  }]
}
@Component({
  selector: 'set-of-algebraic-identifier-editor',
  templateUrl: './set-of-algebraic-identifier-editor.component.html',
  styleUrls: []
})
export class SetOfAlgebraicIdentifierEditorComponent implements OnInit {
  @Input() modalId: symbol;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  PLACEHOLDER_INFO = (
    'NOTE: This rule will consider each side of the equation ' +
    'independently and won\'t allow reordering of terms ' +
    'around the = sign.');
  SCHEMA: SetOfAlgebraicIdentifierEditorSchema;
  constructor(
    private guppyInitializationService: GuppyInitializationService,
    private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    let customOskLetters = (
      this.guppyInitializationService.getCustomOskLetters());

    let choices = (
      customOskLetters ? customOskLetters :
      AppConstants.VALID_ALGEBRAIC_IDENTIFIERS);

    this.SCHEMA = {
      type: 'list',
      items: {
        type: 'unicode',
        choices: choices as unknown as string[]
      },
      validators: [{
        id: 'is_uniquified'
      }]
    };

    if (!this.value) {
      this.value = [];
    }
  }

  getSchema(): SetOfAlgebraicIdentifierEditorSchema {
    return this.SCHEMA;
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

angular.module('oppia').directive(
  'setOfAlgebraicIdentifierEditor', downgradeComponent({
    component: SetOfAlgebraicIdentifierEditorComponent
  }) as angular.IDirectiveFactory);
