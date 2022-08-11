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
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { StateCard } from 'domain/state_card/state-card.model';
import { BrowserCheckerService } from 'domain/utilities/browser-checker.service';
import { MultipleChoiceInputCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { AudioTranslationManagerService } from 'pages/exploration-player-page/services/audio-translation-manager.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { MultipleChoiceInputRulesService } from './multiple-choice-input-rules.service';

import '../static/multiple_choice_input.css';

@Component({
  selector: 'oppia-interactive-multiple-choice-input',
  templateUrl: './multiple-choice-input-interaction.component.html'
})
export class InteractiveMultipleChoiceInputComponent implements OnInit {
  COMPONENT_NAME_RULE_INPUT!: string;
  @Input() choicesWithValue: string;
  @Input() showChoicesInShuffledOrderWithValue: string;
  choices;
  answer;
  questionIsAnsweredOnce = false;
  orderOfChoices: number[] = [];
  displayedCard!: StateCard;
  recordedVoiceovers!: RecordedVoiceovers;

  constructor(
    private browserCheckerService: BrowserCheckerService,
    private currentInteractionService: CurrentInteractionService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private multipleChoiceInputRulesService: MultipleChoiceInputRulesService,
    private audioTranslationManagerService: AudioTranslationManagerService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService
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
    // If choices need to be shuffled, shuffle them, if question is answered
    // once before, get the previous order of choices, otherwise order the
    // choices based on their original index.
    this.questionIsAnsweredOnce = this.isQuestionOnceAnswered();
    if (this.questionIsAnsweredOnce) {
      let previousOrderOfChoices = this.getPreviousOrderOfChoices();
      // Sort the choices based on the previous order of choices.
      this.choices = (
        choicesWithIndex.sort((c1, c2) => {
          return (
            previousOrderOfChoices.indexOf(c1.originalIndex) -
            previousOrderOfChoices.indexOf(c2.originalIndex));
        })
      );
    } else {
      this.choices = (
        showChoicesInShuffledOrder.value ? shuffleChoices(choicesWithIndex) :
        choicesWithIndex.sort((c1, c2) => c1.originalIndex - c2.originalIndex)
      );
    }

    // Update the current choice order, so that it can be used to
    // next time the question is answered.
    for (let i = 0; i < this.choices.length; i++) {
      this.orderOfChoices.push(this.choices[i].originalIndex);
    }

    // Setup voiceover.
    this.displayedCard = this.playerTranscriptService.getCard(
      this.playerPositionService.getDisplayedCardIndex());
    if (this.displayedCard) {
      this.recordedVoiceovers = this.displayedCard.getRecordedVoiceovers();

      // Combine labels for voiceover.
      let combinedChoiceLabels = '';
      for (const choice of choices.value) {
        combinedChoiceLabels += this.audioTranslationManagerService
          .cleanUpHTMLforVoiceover(choice.html);
      }
      // Say the choices aloud if autoplay is enabled.
      this.audioTranslationManagerService.setSequentialAudioTranslations(
        this.recordedVoiceovers.getBindableVoiceovers(
          choices.value[0]._contentId),
        combinedChoiceLabels, this.COMPONENT_NAME_RULE_INPUT
      );
    }

    this.answer = null;
    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitAnswer(), () => this.validityCheckFn());
  }

  isQuestionOnceAnswered(): boolean {
    // Check if oppia-mcq-choice-order attribute is present in question
    // element which indicates that the question has been answered
    // once previously.
    let questionElement = document.querySelector(
      '.oppia-rte-viewer.oppia-learner-view-card-top-content');
    if (questionElement && questionElement.getAttribute(
      'oppia-mcq-choice-order')) {
      return true;
    }
    return false;
  }

  getPreviousOrderOfChoices(): number[] {
    // Get stored choices order from question element to
    // prevent shuffling of choices.
    let questionElement = document.querySelector(
      '.oppia-rte-viewer.oppia-learner-view-card-top-content');
    let choicesOrder = questionElement.getAttribute('oppia-mcq-choice-order');
    const previousOrderOfChoices = JSON.parse(choicesOrder);
    return previousOrderOfChoices;
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
    // Store current choice order in question element to
    // prevent shuffling of choices after the first selection attempt.
    let questionElement = document.querySelector(
      '.oppia-rte-viewer.oppia-learner-view-card-top-content');
    if (questionElement) {
      questionElement.setAttribute(
        'oppia-mcq-choice-order', JSON.stringify(this.orderOfChoices));
    }
    if (!this.browserCheckerService.isMobileDevice()) {
      this.submitAnswer();
    }
  }

  submitAnswer(): void {
    if (this.answer === null) {
      return;
    }
    this.currentInteractionService.onSubmit(
      this.answer, this.multipleChoiceInputRulesService);
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveMultipleChoiceInput',
  downgradeComponent({
    component: InteractiveMultipleChoiceInputComponent
  })
);
