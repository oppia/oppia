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
 * @fileoverview Component for the ItemSelectionInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ItemSelectionInputCustomizationArgs } from 'interactions/customization-args-defs';
import { BrowserCheckerService } from 'domain/utilities/browser-checker.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';
import { ItemSelectionInputRulesService } from 'interactions/ItemSelectionInput/directives/item-selection-input-rules.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';

@Component({
  selector: 'oppia-interactive-item-selection-input',
  templateUrl: './item-selection-input-interaction.component.html',
  styleUrls: []
})
export class InteractiveItemSelectionInputComponent implements OnInit {
  @Input() choicesWithValue: string;
  @Input() maxAllowableSelectionCountWithValue: string;
  @Input() minAllowableSelectionCountWithValue: string;
  choices: string[];
  choicesValue: SubtitledHtml[];
  displayCheckboxes: boolean;
  maxAllowableSelectionCount: number;
  minAllowableSelectionCount: number;
  newQuestion: boolean;
  notEnoughSelections: boolean;
  preventAdditionalSelections: boolean;
  selectionCount: number;
  userSelections: {[key: string]: boolean};

  constructor(
    private browserCheckerService: BrowserCheckerService,
    private currentInteractionService: CurrentInteractionService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private itemSelectionInputRulesService: ItemSelectionInputRulesService) {}

  ngOnInit(): void {
    const {
      choices,
      maxAllowableSelectionCount,
      minAllowableSelectionCount
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'ItemSelectionInput',
      {
        choicesWithValue: this.choicesWithValue,
        maxAllowableSelectionCountWithValue:
          this.maxAllowableSelectionCountWithValue,
        minAllowableSelectionCountWithValue:
          this.minAllowableSelectionCountWithValue
      }
    ) as ItemSelectionInputCustomizationArgs;

    this.choicesValue = choices.value;
    this.choices = this.choicesValue.map(choice => choice.html);
    this.maxAllowableSelectionCount = maxAllowableSelectionCount.value;
    this.minAllowableSelectionCount = minAllowableSelectionCount.value;

    // The following is an associative array where the key is a choice
    // (html) and the value is a boolean value indicating whether the
    // choice was selected by the user (default is false).
    this.userSelections = {};

    for (let i = 0; i < this.choices.length; i++) {
      this.userSelections[this.choices[i]] = false;
    }

    this.displayCheckboxes = this.maxAllowableSelectionCount > 1;

    // The following indicates that the number of answers is more than
    // maxAllowableSelectionCount.
    this.preventAdditionalSelections = false;

    // The following indicates that the number of answers is less than
    // minAllowableSelectionCount.
    this.notEnoughSelections = this.minAllowableSelectionCount > 0;
    this.currentInteractionService.registerCurrentInteraction(
      this.submitAnswer.bind(this), this.validityCheckFn.bind(this));
  }

  onToggleCheckbox(): void {
    this.newQuestion = false;
    this.selectionCount = Object.keys(this.userSelections).filter(
      (obj) => this.userSelections[obj]).length;
    this.preventAdditionalSelections = (
      this.selectionCount >= this.maxAllowableSelectionCount);
    this.notEnoughSelections = (
      this.selectionCount < this.minAllowableSelectionCount);
  }

  submitMultipleChoiceAnswer(event: MouseEvent, index: number): void {
    event.preventDefault();
    // Deselect previously selected option.
    if ((event.currentTarget as HTMLDivElement).classList.contains(
      'selected')) {
      (event.currentTarget as HTMLDivElement).classList.remove('selected');
    }
    // Selected current option.
    (event.currentTarget as HTMLDivElement).classList.add('selected');
    this.userSelections = {};
    this.userSelections[this.choices[index]] = true;
    this.notEnoughSelections = false;
    if (!this.browserCheckerService.isMobileDevice()) {
      this.submitAnswer();
    }
  }

  submitAnswer(): void {
    const htmlAnswers = Object.keys(this.userSelections).filter(
      (obj) => this.userSelections[obj]);
    const answers = htmlAnswers.map(
      html => this.choicesValue[this.choices.indexOf(html)].contentId);

    this.currentInteractionService.onSubmit(
      answers as unknown as string,
      this.itemSelectionInputRulesService as unknown as
      InteractionRulesService);
  }

  validityCheckFn(): boolean {
    return !this.notEnoughSelections;
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveItemSelectionInput', downgradeComponent({
    component: InteractiveItemSelectionInputComponent
  }) as angular.IDirectiveFactory);
