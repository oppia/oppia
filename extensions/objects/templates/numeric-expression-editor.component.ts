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
 * @fileoverview Component for numeric expression editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';
import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';
import { AppConstants } from 'app.constants';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { GuppyConfigurationService } from 'services/guppy-configuration.service';
import { GuppyInitializationService } from 'services/guppy-initialization.service';
import { MathInteractionsService } from 'services/math-interactions.service';

@Component({
  selector: 'numeric-expression-editor',
  templateUrl: './numeric-expression-editor.component.html'
})
export class NumericExpressionEditorComponent implements OnInit {
  @Input() modalId: symbol;
  @Input() value;
  @Output() valueChanged = new EventEmitter();

  warningText = '';
  hasBeenTouched = false;
  currentValue: string;
  alwaysEditable: boolean;
  eventBusGroup: EventBusGroup;

  constructor(
    private deviceInfoService: DeviceInfoService,
    private eventBusService: EventBusService,
    private guppyConfigurationService: GuppyConfigurationService,
    private guppyInitializationService: GuppyInitializationService,
    private mathInteractionsService: MathInteractionsService
  ) {
    this.eventBusGroup = new EventBusGroup(this.eventBusService);
  }


  ngOnInit(): void {
    this.alwaysEditable = true;
    this.hasBeenTouched = false;
    if (this.value === null) {
      this.value = '';
      this.valueChanged.emit(this.value);
    }
    this.currentValue = this.value;
    this.guppyConfigurationService.init();
    this.guppyInitializationService.init(
      'guppy-div-creator',
      AppConstants.MATH_INTERACTION_PLACEHOLDERS.NumericExpressionInput,
      this.value);
    let eventType = (
      this.deviceInfoService.isMobileUserAgent() &&
      this.deviceInfoService.hasTouchEvents()) ? 'focus' : 'change';
    // We need the 'focus' event while using the on screen keyboard (only
    // for touch-based devices) to capture input from user and the 'change'
    // event while using the normal keyboard.
    if (eventType === 'focus') {
      Guppy.event('focus', (focusObj) => {
        const activeGuppyObject = (
          this.guppyInitializationService.findActiveGuppyObject());
        if (activeGuppyObject !== undefined) {
          this.hasBeenTouched = true;
          this.currentValue = activeGuppyObject.guppyInstance.asciimath();
        }
        if (!focusObj.focused) {
          this.isCurrentAnswerValid();
        }
      });
    } else {
      Guppy.event('change', (focusObj) => {
        const activeGuppyObject = (
          this.guppyInitializationService.findActiveGuppyObject());
        if (activeGuppyObject !== undefined) {
          this.hasBeenTouched = true;
          this.currentValue = activeGuppyObject.guppyInstance.asciimath();
        }
        if (!focusObj.focused) {
          this.isCurrentAnswerValid();
        }
      });
      Guppy.event('focus', (focusObj) => {
        if (!focusObj.focused) {
          this.isCurrentAnswerValid();
        }
      });
    }
  }

  isCurrentAnswerValid(): boolean {
    if (this.currentValue === undefined) {
      this.currentValue = '';
    }
    // Replacing abs symbol, '|x|', with text, 'abs(x)' since the symbol
    // is not compatible with nerdamer or with the backend validations.
    this.currentValue = this.mathInteractionsService.replaceAbsSymbolWithText(
      this.currentValue);
    var answerIsValid = this.mathInteractionsService.validateNumericExpression(
      this.currentValue);
    if (this.guppyInitializationService.findActiveGuppyObject() === undefined) {
      // The warnings should only be displayed when the editor is inactive
      // focus, i.e., the user is done typing.
      this.warningText = this.mathInteractionsService.getWarningText();
    } else {
      this.warningText = '';
    }
    if (answerIsValid) {
      // Explicitly inserting '*' signs wherever necessary.
      this.currentValue = (
        this.mathInteractionsService.insertMultiplicationSigns(
          this.currentValue));
      this.value = this.currentValue;
      this.valueChanged.emit(this.value);
    }
    if (!this.hasBeenTouched) {
      this.warningText = '';
    }
    this.eventBusGroup.emit(new ObjectFormValidityChangeEvent({
      modalId: this.modalId,
      value: !answerIsValid
    }));
    return answerIsValid;
  }

  showOSK(): void {
    this.guppyInitializationService.setShowOSK(true);
    GuppyInitializationService.interactionType = 'NumericExpressionInput';
  }
}

angular.module('oppia').directive(
  'numericExpressionEditor', downgradeComponent({
    component: NumericExpressionEditorComponent
  }) as angular.IDirectiveFactory);
