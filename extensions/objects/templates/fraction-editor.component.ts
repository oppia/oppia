// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for fraction editor.
 */


import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Fraction } from 'domain/objects/fraction.model';
import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';

@Component({
  selector: 'fraction-editor',
  templateUrl: './fraction-editor.component.html',
  styleUrls: []
})
export class FractionEditorComponent implements OnInit {
  @Input() modalId: symbol;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  errorMessage: string = '';
  fractionString: string = '0';
  currentFractionValueIsValid = false;
  eventBus: EventBusGroup;
  constructor(
    private eventBusService: EventBusService) {
    this.eventBus = new EventBusGroup(this.eventBusService);
  }

  ngOnInit(): void {
    if (this.value !== null) {
      this.fractionString = Fraction.fromDict(this.value).toString();
    }
  }

  validateFraction(newFraction: string): void {
    if (newFraction.length === 0) {
      this.errorMessage = 'Please enter a non-empty fraction value.';
      this.currentFractionValueIsValid = false;
    }
    try {
      const INTERMEDIATE_REGEX = /^\s*-?\s*$/;
      if (!INTERMEDIATE_REGEX.test(newFraction)) {
        this.value = Fraction.fromRawInputString(newFraction);
        this.valueChanged.emit(this.value);
      }
      this.errorMessage = '';
      this.currentFractionValueIsValid = true;
    } catch (parsingError) {
      this.errorMessage = parsingError.message;
      this.currentFractionValueIsValid = false;
    } finally {
      this.eventBus.emit(new ObjectFormValidityChangeEvent(
        {value: !this.currentFractionValueIsValid, modalId: this.modalId}));
    }
  }
}

angular.module('oppia').directive(
  'fractionEditor', downgradeComponent({
    component: FractionEditorComponent
  }) as angular.IDirectiveFactory);
