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
 * @fileoverview Component for algebraic expression editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { GuppyConfigurationService } from 'services/guppy-configuration.service';
import { GuppyInitializationService } from 'services/guppy-initialization.service';
import { MathInteractionsService } from 'services/math-interactions.service';

@Component({
  selector: 'algebraic-expression-editor',
  templateUrl: './algebraic-expression-editor.component.html'
})
export class AlgebraicExpressionEditor implements OnInit {
  @Input() value;
  @Output() valueChanged: EventEmitter<string> = new EventEmitter<string>();
  warningText: string = '';
  hasBeenTouched: boolean = false;
  alwaysEditable: boolean = true;
  currentValue: string = '';

  constructor(
    private cdRef: ChangeDetectorRef,
    private deviceInfoService: DeviceInfoService,
    private guppyConfigurationService: GuppyConfigurationService,
    private guppyInitializationService: GuppyInitializationService,
    private mathInteractionsService: MathInteractionsService
  ) {}

  ngOnInit(): void {
    if (this.value === null) {
      this.value = '';
      this.valueChanged.emit(this.value);
    }
    this.currentValue = this.value;
    this.guppyConfigurationService.init();
    this.guppyInitializationService.init(
      'guppy-div-creator',
      AppConstants.MATH_INTERACTION_PLACEHOLDERS.AlgebraicExpressionInput,
      this.value);
    let eventType = (
      this.deviceInfoService.isMobileUserAgent() &&
      this.deviceInfoService.hasTouchEvents()) ? 'focus' : 'change';
    // We need the 'focus' event while using the on screen keyboard (only
    // for touch-based devices) to capture input from user and the 'change'
    // event while using the normal keyboard.
    Guppy.event(eventType, (focusObj) => {
      if (!focusObj.focused) {
        this.isCurrentAnswerValid();
      }
      const activeGuppyObject = (
        this.guppyInitializationService.findActiveGuppyObject());
      if (activeGuppyObject !== undefined) {
        this.hasBeenTouched = true;
        this.currentValue = activeGuppyObject.guppyInstance.asciimath();
        if (eventType === 'change') {
          // Need to manually trigger the digest cycle to make any
          // 'watchers' aware of changes in answer.
          this.currentValue = activeGuppyObject.guppyInstance.asciimath();
          this.isCurrentAnswerValid();
          this.cdRef.markForCheck();
        }
      }
    });
    Guppy.event('change', () => {
      const activeGuppyObject = (
        this.guppyInitializationService.findActiveGuppyObject());
      if (activeGuppyObject) {
        this.currentValue = activeGuppyObject.guppyInstance.asciimath();
        this.isCurrentAnswerValid();
      }
    });
    if (eventType !== 'focus') {
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
    const answerIsValid = (
      this.mathInteractionsService.validateAlgebraicExpression(
        this.currentValue,
        this.guppyInitializationService.getCustomOskLetters()));
    if (this.guppyInitializationService.findActiveGuppyObject() === undefined) {
      // The warnings should only be displayed when the editor is inactive
      // focus, i.e., the user is done typing.
      this.warningText = this.mathInteractionsService.getWarningText();
    } else {
      this.warningText = '';
    }
    if (answerIsValid) {
      this.currentValue = (
        this.mathInteractionsService.insertMultiplicationSigns(
          this.currentValue));
      this.value = this.currentValue;
      this.valueChanged.emit(this.value);
    }
    if (!this.hasBeenTouched) {
      this.warningText = '';
    }
    return answerIsValid;
  }

  showOSK(): void {
    this.guppyInitializationService.setShowOSK(true);
    GuppyInitializationService.interactionType = 'AlgebraicExpressionInput';
  }
}

angular.module('oppia').directive(
  'algebraicExpressionEditor', downgradeComponent({
    component: AlgebraicExpressionEditor
  }) as angular.IDirectiveFactory);
