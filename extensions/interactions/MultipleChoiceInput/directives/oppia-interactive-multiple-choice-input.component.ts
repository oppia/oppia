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
import { MultipleChoiceInputCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { AudioTranslationManagerService } from 'pages/exploration-player-page/services/audio-translation-manager.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { MultipleChoiceInputRulesService } from './multiple-choice-input-rules.service';
import { MultipleChoiceInputOrderedChoicesService, ChoiceWithIndex } from './multiple-choice-input-ordered-choices-service';

import '../static/multiple_choice_input.css';

@Component({
  selector: 'oppia-interactive-multiple-choice-input',
  templateUrl: './multiple-choice-input-interaction.component.html'
})
export class InteractiveMultipleChoiceInputComponent implements OnInit {
  COMPONENT_NAME_RULE_INPUT!: string;
  @Input() choicesWithValue: string;
  @Input() showChoicesInShuffledOrderWithValue: string;
  choices: ChoiceWithIndex[];
  answer;
  displayedCard!: StateCard;
  errorMessageI18nKey: string = '';
  recordedVoiceovers!: RecordedVoiceovers;

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private multipleChoiceInputRulesService: MultipleChoiceInputRulesService,
    private audioTranslationManagerService: AudioTranslationManagerService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private multipleChoiceInputOrderedChoicesService:
      MultipleChoiceInputOrderedChoicesService
  ) { }

  private getAttrs() {
    return {
      choicesWithValue: this.choicesWithValue,
      showChoicesInShuffledOrderWithValue: (
        this.showChoicesInShuffledOrderWithValue)
    };
  }

  private validate(): boolean {
    return this.answer !== null;
  }

  private shuffleChoices(choices: ChoiceWithIndex[]): void {
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
  }

  private getOrderedChoices(): ChoiceWithIndex[] {
    if (this.playerTranscriptService.getNumSubmitsForLastCard() > 0) {
      return this.multipleChoiceInputOrderedChoicesService.get();
    }

    const {
      showChoicesInShuffledOrder,
      choices
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'MultipleChoiceInput',
      this.getAttrs()
    ) as MultipleChoiceInputCustomizationArgs;

    const choicesWithIndex = choices.value.map(
      (value, originalIndex) => ({originalIndex, choice: value})
    );

    if (showChoicesInShuffledOrder.value) {
      this.shuffleChoices(choicesWithIndex);
    } else {
      choicesWithIndex.sort(
        (c1, c2) => c1.originalIndex - c2.originalIndex);
    }
    this.multipleChoiceInputOrderedChoicesService.store(choicesWithIndex);
    return choicesWithIndex;
  }

  ngOnInit(): void {
    this.choices = this.getOrderedChoices();
    // Setup voiceover.
    this.displayedCard = this.playerTranscriptService.getCard(
      this.playerPositionService.getDisplayedCardIndex());
    if (this.displayedCard) {
      this.recordedVoiceovers = this.displayedCard.getRecordedVoiceovers();

      // Combine labels for voiceover.
      let combinedChoiceLabels = '';
      for (const choice of this.choices) {
        combinedChoiceLabels += this.audioTranslationManagerService
          .cleanUpHTMLforVoiceover(choice.choice.html);
      }
      // Say the choices aloud if autoplay is enabled.
      this.audioTranslationManagerService.setSequentialAudioTranslations(
        this.recordedVoiceovers.getBindableVoiceovers(
          this.choices[0].choice.contentId),
        combinedChoiceLabels, this.COMPONENT_NAME_RULE_INPUT
      );
    }

    this.answer = null;
    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitAnswer(), () => this.validate());
  }

  selectAnswer(event: MouseEvent, answer: string): void {
    event.preventDefault();
    if (answer === null) {
      return;
    }
    this.errorMessageI18nKey = '';
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
    this.currentInteractionService.updateCurrentAnswer(this.answer);
  }

  submitAnswer(): void {
    if (this.answer === null) {
      if (this.currentInteractionService.showNoResponseError()) {
        this.errorMessageI18nKey =
        'I18N_INTERACTIONS_ITEM_SELECTION_NO_RESPONSE';
      }
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
