// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the NumberWithUnits interaction.
 */

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { downgradeComponent } from '@angular/upgrade/static';

import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';

import { NumberWithUnitsAnswer, InteractionAnswer } from 'interactions/answer-defs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HelpModalNumberWithUnitsComponent } from './oppia-help-modal-number-with-units.component';
import { NumberWithUnitsObjectFactory } from 'domain/objects/NumberWithUnitsObjectFactory';
import { NumberWithUnitsRulesService } from './number-with-units-rules.service';

@Component({
  selector: 'oppia-interactive-number-with-units',
  templateUrl: './number-with-units-interaction.component.html',
  styleUrls: []
})
export class InteractiveNumberWithUnitsComponent
    implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() labelForFocusTarget!: string;
  @Input() savedSolution!: InteractionAnswer;
  componentSubscriptions: Subscription = new Subscription();
  FORM_ERROR_TYPE: string = 'NUMBER_WITH_UNITS_FORMAT_ERROR';
  errorMessageI18nKey: string = '';
  answer: string = '';
  isValid: boolean = true;
  answerChanged: Subject<string> = new Subject<string>();
  NUMBER_WITH_UNITS_FORM_SCHEMA = {
    type: 'unicode',
    ui_config: {}
  };

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private focusManagerService: FocusManagerService,
    private numberWithUnitsObjectFactory: NumberWithUnitsObjectFactory,
    private numberWithUnitsRulesService: NumberWithUnitsRulesService,
    private ngbModal: NgbModal,
  ) {
    this.componentSubscriptions.add(this.answerChanged.pipe(
      // Wait 150ms after the last event before emitting last event.
      debounceTime(150),
      // Only emit if value is different from previous value.
      distinctUntilChanged()
    ).subscribe(newValue => {
      try {
        this.numberWithUnitsObjectFactory.fromRawInputString(newValue);
        this.errorMessageI18nKey = '';
        this.isValid = true;
      } catch (parsingError) {
        if (parsingError instanceof Error) {
          this.errorMessageI18nKey = parsingError.message;
        }
        this.isValid = false;
      }
      this.currentInteractionService.updateViewWithNewAnswer();
    }));
  }

  ngOnInit(): void {
    if (this.savedSolution !== undefined) {
      let savedSolution = this.savedSolution;
      savedSolution = this.numberWithUnitsObjectFactory.fromDict(
        savedSolution as NumberWithUnitsAnswer).toString();
      this.answer = savedSolution;
    } else {
      this.answer = '';
    }

    try {
      this.numberWithUnitsObjectFactory.createCurrencyUnits();
    } catch (parsingError) {}

    const submitAnswerFn = () => this.submitAnswer();
    const isAnswerValid = () => this.isAnswerValid();
    this.currentInteractionService.registerCurrentInteraction(
      submitAnswerFn, isAnswerValid);

    setTimeout(
      () => {
        let focusLabel: string = this.labelForFocusTarget;
        this.focusManagerService.setFocusWithoutScroll(focusLabel);
      }, 0);
  }

  submitAnswer(): void {
    try {
      if (this.answer.trim() === '' &&
          this.currentInteractionService.showNoResponseError()) {
        this.errorMessageI18nKey = 'I18N_INTERACTIONS_INPUT_NO_RESPONSE';
        return;
      }
      const numberWithUnits = (
        this.numberWithUnitsObjectFactory.fromRawInputString(this.answer));
      this.currentInteractionService.onSubmit(
        numberWithUnits,
        this.numberWithUnitsRulesService as NumberWithUnitsRulesService);
    } catch (parsingError) {
      if (parsingError instanceof Error) {
        this.errorMessageI18nKey = parsingError.message;
      } else {
        throw parsingError;
      }
      this.isValid = false;
    }
  }

  showHelp(): void {
    this.ngbModal.open(HelpModalNumberWithUnitsComponent, {
      backdrop: true,
      windowClass: 'oppia-help-modal-number-with-units'
    }).result.then(() => {}, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  isAnswerValid(): boolean {
    return this.isValid && this.answer !== '';
  }

  answerValueChanged(): void {
    this.answerChanged.next(this.answer);
    this.currentInteractionService.updateCurrentAnswer(this.answer);
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveNumberWithUnits', downgradeComponent({
    component: InteractiveNumberWithUnitsComponent
  }) as angular.IDirectiveFactory);
