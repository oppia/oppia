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

import {Component, Input, OnInit} from '@angular/core';
import {ItemSelectionInputCustomizationArgs} from 'interactions/customization-args-defs';
import {BrowserCheckerService} from 'domain/utilities/browser-checker.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {ItemSelectionInputRulesService} from 'interactions/ItemSelectionInput/directives/item-selection-input-rules.service';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {AudioTranslationManagerService} from 'pages/exploration-player-page/services/audio-translation-manager.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {PlayerTranscriptService} from 'pages/exploration-player-page/services/player-transcript.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';

import '../static/item_selection_input.css';

@Component({
  selector: 'oppia-interactive-item-selection-input',
  templateUrl: './item-selection-input-interaction.component.html',
  styleUrls: [],
})
export class InteractiveItemSelectionInputComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() choicesWithValue!: string;
  @Input() maxAllowableSelectionCountWithValue!: string;
  @Input() minAllowableSelectionCountWithValue!: string;
  choices!: string[];
  choicesValue!: SubtitledHtml[];
  maxAllowableSelectionCount!: number;
  minAllowableSelectionCount!: number;
  selectionCount!: number;
  userSelections!: Record<string, boolean>;
  displayedCard!: StateCard;
  recordedVoiceovers!: RecordedVoiceovers;
  COMPONENT_NAME_RULE_INPUT!: string;
  displayCheckboxes: boolean = false;
  newQuestion: boolean = false;
  notEnoughSelections: boolean = false;
  preventAdditionalSelections: boolean = false;
  exactSelections: boolean = false;

  constructor(
    private browserCheckerService: BrowserCheckerService,
    private currentInteractionService: CurrentInteractionService,
    private interactionAttributesExtractorService: InteractionAttributesExtractorService,
    private itemSelectionInputRulesService: ItemSelectionInputRulesService,
    private audioTranslationManagerService: AudioTranslationManagerService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService
  ) {}

  ngOnInit(): void {
    const {choices, maxAllowableSelectionCount, minAllowableSelectionCount} =
      this.interactionAttributesExtractorService.getValuesFromAttributes(
        'ItemSelectionInput',
        {
          choicesWithValue: this.choicesWithValue,
          maxAllowableSelectionCountWithValue:
            this.maxAllowableSelectionCountWithValue,
          minAllowableSelectionCountWithValue:
            this.minAllowableSelectionCountWithValue,
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

    // Setup voiceover.
    this.displayedCard = this.playerTranscriptService.getCard(
      this.playerPositionService.getDisplayedCardIndex()
    );
    if (this.displayedCard) {
      this.recordedVoiceovers = this.displayedCard.getRecordedVoiceovers();

      // Combine labels for voiceover.
      let combinedChoiceLabels = '';
      for (const choiceLabel of this.choices) {
        combinedChoiceLabels +=
          this.audioTranslationManagerService.cleanUpHTMLforVoiceover(
            choiceLabel
          );
      }

      // Say the choices aloud if autoplay is enabled.
      this.audioTranslationManagerService.setSequentialAudioTranslations(
        this.recordedVoiceovers.getBindableVoiceovers(this.getContentId()),
        combinedChoiceLabels,
        this.COMPONENT_NAME_RULE_INPUT
      );
    }

    this.displayCheckboxes = this.maxAllowableSelectionCount > 1;

    // The following indicates that the number of answers is more than
    // maxAllowableSelectionCount.
    this.preventAdditionalSelections = false;

    // The following indicates that the number of answers is less than
    // minAllowableSelectionCount.
    this.notEnoughSelections =
      (this.minAllowableSelectionCount > 0 &&
        this.minAllowableSelectionCount < this.maxAllowableSelectionCount) ||
      (this.minAllowableSelectionCount === 1 &&
        this.maxAllowableSelectionCount === 1);

    this.exactSelections =
      this.minAllowableSelectionCount === this.maxAllowableSelectionCount;
    this.currentInteractionService.registerCurrentInteraction(
      this.submitAnswer.bind(this),
      this.validityCheckFn.bind(this)
    );
  }

  getContentId(): string {
    let contentId = this.choicesValue[0]._contentId;
    if (contentId === null) {
      throw new Error('Content id is null');
    } else {
      return contentId;
    }
  }

  getAnswers(): string[] {
    const htmlAnswers = Object.keys(this.userSelections).filter(
      obj => this.userSelections[obj]
    );
    return htmlAnswers.map(
      html => this.choicesValue[this.choices.indexOf(html)].contentId as string
    );
  }

  onToggleCheckbox(): void {
    this.newQuestion = false;
    this.selectionCount = Object.keys(this.userSelections).filter(
      obj => this.userSelections[obj]
    ).length;
    if (this.minAllowableSelectionCount === this.maxAllowableSelectionCount) {
      if (this.selectionCount < this.maxAllowableSelectionCount) {
        this.exactSelections = true;
        this.preventAdditionalSelections =
          this.selectionCount >= this.maxAllowableSelectionCount;
      } else {
        this.exactSelections = false;
        this.preventAdditionalSelections = true;
      }
    } else {
      this.preventAdditionalSelections =
        this.selectionCount >= this.maxAllowableSelectionCount;
      this.notEnoughSelections =
        this.selectionCount < this.minAllowableSelectionCount &&
        this.minAllowableSelectionCount !== this.maxAllowableSelectionCount;
      this.exactSelections = false;
    }
    this.currentInteractionService.updateCurrentAnswer(this.getAnswers());
  }

  submitMultipleChoiceAnswer(event: MouseEvent, index: number): void {
    event.preventDefault();
    // Deselect previously selected option.
    var selectedElement = document.querySelector(
      'button.multiple-choice-option.selected'
    );
    if (selectedElement) {
      selectedElement.classList.remove('selected');
    }
    // Selected current option.
    (event.currentTarget as HTMLDivElement).classList.add('selected');
    this.userSelections = {};
    this.userSelections[this.choices[index]] = true;
    this.notEnoughSelections = false;
    this.currentInteractionService.updateCurrentAnswer(this.getAnswers());
  }

  submitAnswer(): void {
    const answers = this.getAnswers();
    this.currentInteractionService.onSubmit(
      answers,
      this.itemSelectionInputRulesService as ItemSelectionInputRulesService
    );
  }

  validityCheckFn(): boolean {
    return !this.notEnoughSelections;
  }
}
