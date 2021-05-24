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
 * @fileoverview Component for the MultipleChoiceInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the component is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { BrowserCheckerService } from 'domain/utilities/browser-checker.service';
import { MultipleChoiceInputCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { MultipleChoiceInputRulesService } from './multiple-choice-input-rules.service';

@Component({
  selector: 'oppia-interactive-multiple-choice-input',
  templateUrl: './multiple-choice-input-interaction.component.html'
})
export class InteractiveMultipleChoiceInputComponent implements OnInit {
  @Input() choicesWithValue: string;
  @Input() showChoicesInShuffledOrderWithValue: string;
  choices;
  answer;

  constructor(
    private browserCheckerService: BrowserCheckerService,
    private currentInteractionService: CurrentInteractionService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private multipleChoiceInputRulesService: MultipleChoiceInputRulesService
  ) { }

  private getAttrs() {
    return {
      choicesWithValue: this.choicesWithValue,
      showChoicesInShuffledOrderWithValue: (
        this.showChoicesInShuffledOrderWithValue)
    };
  }

  private validityCheckFn(): boolean {
    return this.answer !== null;
  }

  ngOnInit(): void {
    const {
      showChoicesInShuffledOrder,
      choices
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'MultipleChoiceInput',
      this.getAttrs()
    ) as MultipleChoiceInputCustomizationArgs;

    var choicesWithIndex = choices.value.map(
      function(value, originalIndex) {
        return {originalIndex: originalIndex, value: value.html};
      }
    );

    var shuffleChoices = (choices) => {
      for (
        var currentIndex = choices.length - 1;
        currentIndex >= 0;
        currentIndex--
      ) {
        var temporaryValue = null;
        var randomIndex = null;
        randomIndex = Math.floor(Math.random() * (currentIndex + 1));
        temporaryValue = choices[currentIndex];
        choices[currentIndex] = choices[randomIndex];
        choices[randomIndex] = temporaryValue;
      }
      return choices;
    };
    this.choices = (
      showChoicesInShuffledOrder ? shuffleChoices(choicesWithIndex) :
      choicesWithIndex);
    this.answer = null;
    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitAnswer(), () => this.validityCheckFn());
  }

  selectAnswer(event: MouseEvent, answer: string): void {
    event.preventDefault();
    if (answer === null) {
      return;
    }
    // Deselect previously selected option.
    var selectedElement = (
      document.querySelector(
        'button.multiple-choice-option.selected'));
    if (selectedElement) {
      selectedElement.classList.remove('selected');
    }
    // Selected current option.
    (event.currentTarget as HTMLDivElement).classList.add('selected');
    this.answer = parseInt(answer, 10);
    if (!this.browserCheckerService.isMobileDevice()) {
      this.submitAnswer();
    }
  }

  submitAnswer(): void {
    if (this.answer === null) {
      return;
    }
    this.currentInteractionService.onSubmit(
      this.answer as unknown as string,
      this.multipleChoiceInputRulesService as unknown as InteractionRulesService
    );
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveMultipleChoiceInput',
  downgradeComponent({
    component: InteractiveMultipleChoiceInputComponent
  })
);
