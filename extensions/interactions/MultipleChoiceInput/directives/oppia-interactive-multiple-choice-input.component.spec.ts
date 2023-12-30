// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the MultipleChoiceInput interaction.
  */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { InteractiveMultipleChoiceInputComponent } from './oppia-interactive-multiple-choice-input.component';
import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { AudioTranslationLanguageService } from 'pages/exploration-player-page/services/audio-translation-language.service';
import { StateCard } from 'domain/state_card/state-card.model';
import { TranslateModule } from '@ngx-translate/core';
import { InteractionAnswer } from 'interactions/answer-defs';

describe('InteractiveMultipleChoiceInputComponent', () => {
  let component: InteractiveMultipleChoiceInputComponent;
  let fixture: ComponentFixture<InteractiveMultipleChoiceInputComponent>;
  let currentInteractionService: CurrentInteractionService;
  let playerTranscriptService: PlayerTranscriptService;
  let displayedCard: StateCard;

  class MockInteractionAttributesExtractorService {
    getValuesFromAttributes(interactionId, attributes) {
      return {
        showChoicesInShuffledOrder: {
          value: JSON.parse(attributes.showChoicesInShuffledOrderWithValue)
        },
        choices: {
          value: JSON.parse(attributes.choicesWithValue)
        }
      };
    }
  }

  class MockCurrentInteractionService {
    onSubmit(answer, rulesService) {
      expect(answer).toBe(1);
    }

    showNoResponseError(): boolean {
      return false;
    }

    updateCurrentAnswer(answer: InteractionAnswer): void {}

    registerCurrentInteraction(submitAnswerFn, validateExpressionFn) {
      submitAnswerFn();
      validateExpressionFn();
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveMultipleChoiceInputComponent],
      imports: [
        TranslateModule.forRoot({
          useDefaultLang: true,
          isolate: false,
          extend: false,
          defaultLanguage: 'en'
        })
      ],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: MockInteractionAttributesExtractorService
        },
        {
          provide: CurrentInteractionService,
          useClass: MockCurrentInteractionService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    fixture = TestBed.createComponent(InteractiveMultipleChoiceInputComponent);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    component = fixture.componentInstance;

    let contentId: string = 'content_id';
    let interaction = {} as Interaction;
    let recordedVoiceovers = new RecordedVoiceovers({});
    let audioTranslation = {} as AudioTranslationLanguageService;
    displayedCard = new StateCard(
      'test_name', 'content', 'interaction', interaction, [],
      recordedVoiceovers, contentId, audioTranslation);


    component.choicesWithValue = '[' +
      '{' +
      '    "html": "<p>opt1</p>",' +
      '    "contentId": "ca_choices_9"' +
      '},' +
      '{' +
      '    "html": "<p>opt2</p>",' +
      '    "contentId": "ca_choices_10"' +
      '},' +
      '{' +
      '    "html": "<p>opt3</p>",' +
      '    "contentId": "ca_choices_11"' +
      '},' +
      '{' +
      '    "html": "<p>opt4</p>",' +
      '    "contentId": "ca_choices_12"' +
      '}' +
  ']';
    component.showChoicesInShuffledOrderWithValue = 'false';
  });

  it('should initalise component when user selects multiple choice ' +
  'interaction', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction')
      .and.callThrough();
    spyOn(playerTranscriptService, 'getCard').and.returnValue(displayedCard);
    spyOn(playerTranscriptService, 'getNumSubmitsForLastCard')
      .and.returnValue(0);
    component.ngOnInit();

    expect(component.choices).toEqual([
      {
        originalIndex: 0,
        choice: {html: '<p>opt1</p>', contentId: 'ca_choices_9'}
      },
      {
        originalIndex: 1,
        choice: {html: '<p>opt2</p>', contentId: 'ca_choices_10'}
      },
      {
        originalIndex: 2,
        choice: {html: '<p>opt3</p>', contentId: 'ca_choices_11'}
      },
      {
        originalIndex: 3,
        choice: {html: '<p>opt4</p>', contentId: 'ca_choices_12'}
      }
    ]);

    expect(component.answer).toBeNull();
    expect(currentInteractionService.registerCurrentInteraction)
      .toHaveBeenCalled();
  });

  it('should initialise component when user selects multiple choice ' +
  'interaction. Should persist the order when component is reinitiated', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction')
      .and.callThrough();
    spyOn(playerTranscriptService, 'getCard').and.returnValue(displayedCard);
    spyOn(playerTranscriptService, 'getNumSubmitsForLastCard')
      .and.returnValues(0, 1);
    component.showChoicesInShuffledOrderWithValue = 'true';

    component.ngOnInit();

    const choices = component.choices;

    // We cannot test if the choices have been shuffled because
    // each time a different order will come. Since the shuffling is random
    // there is a possibility that the choices may not be shuffled.
    // Therefore testing the order can result in flakiness in the
    // frontend tests.

    component.ngOnInit();
    expect(component.choices).toEqual(choices);
  });

  it('should update selected answer when user selects an option', () => {
    let dummyMouseEvent = new MouseEvent('Mouse');
    component.errorMessageI18nKey = 'Some error';
    spyOn(currentInteractionService, 'updateCurrentAnswer');
    spyOn(document, 'querySelector')
      .withArgs('button.multiple-choice-option.selected').and.returnValue({
        // This throws "Type '{ add: () => void; remove: () => void; }'
        // is missing the following properties from type 'DOMTokenList':
        // length, value, contains, item, and 4 more". We need to suppress
        // this error because typescript expects more
        // properties than just one add and remove.
        // We need only add and remove for testing purposes.
        // @ts-expect-error
        classList: {
          add: () => {
            return;
          },
          remove: () => {
            return;
          }
        }
      });
    spyOnProperty(dummyMouseEvent, 'currentTarget').and.returnValue(
      {
        classList: {
          add: () => {
            return;
          },
          remove: () => {
            return;
          }
        }

      }
    );
    component.selectAnswer(dummyMouseEvent, '1');

    expect(component.answer).toBe(1);
    expect(
      currentInteractionService.updateCurrentAnswer).toHaveBeenCalledOnceWith(
      1);
    expect(component.errorMessageI18nKey).toEqual('');
  });

  it('should not update the answer if the user does not select any', () => {
    let dummyMouseEvent = new MouseEvent('Mouse');
    component.answer = 1;

    component.selectAnswer(dummyMouseEvent, null);

    expect(component.answer).toBe(1);
  });

  it('should not submit answer when user selects option if user is on' +
  ' a mobile', () => {
    let dummyMouseEvent = new MouseEvent('Mouse');
    component.errorMessageI18nKey = 'Some error';
    spyOn(currentInteractionService, 'updateCurrentAnswer');
    spyOn(document, 'querySelectorAll')
      .withArgs('button.multiple-choice-option.selected').and.returnValue([{
        // This throws "Type '{ add: () => void; remove: () => void; }'
        // is missing the following properties from type 'DOMTokenList':
        // length, value, contains, item, and 4 more". We need to suppress
        // this error because typescript expects around more
        // properties than just one add and remove.
        // We need only add and remove for testing purposes.
        // @ts-expect-error
        classList: {
          add: () => {
            return;
          },
          remove: () => {
            return;
          }
        }
      }]);
    spyOnProperty(dummyMouseEvent, 'currentTarget').and.returnValue(
      {
        classList: {
          add: () => {
            return;
          },
          remove: () => {
            return;
          }
        }

      }
    );
    spyOn(component, 'submitAnswer');

    component.selectAnswer(dummyMouseEvent, '1');

    expect(component.submitAnswer).not.toHaveBeenCalled();
    expect(
      currentInteractionService.updateCurrentAnswer).toHaveBeenCalledOnceWith(
      1);
    expect(component.errorMessageI18nKey).toEqual('');
  });

  it('should submit answer when user submits answer', () => {
    component.answer = 1;
    spyOn(currentInteractionService, 'onSubmit').and.callThrough();
    spyOn(currentInteractionService, 'showNoResponseError');

    component.submitAnswer();

    expect(currentInteractionService.onSubmit).toHaveBeenCalled();
    expect(
      currentInteractionService.showNoResponseError).not.toHaveBeenCalled();
  });

  it('should not submit answer when no answer is selected', () => {
    component.answer = null;
    spyOn(currentInteractionService, 'onSubmit').and.callThrough();

    component.submitAnswer();

    expect(currentInteractionService.onSubmit).not.toHaveBeenCalled();
    expect(component.errorMessageI18nKey).toEqual('');
  });

  it('should show "no response error" if no answer is selected', () => {
    component.answer = null;
    spyOn(currentInteractionService, 'onSubmit').and.callThrough();
    spyOn(
      currentInteractionService, 'showNoResponseError').and.returnValue(true);

    component.submitAnswer();

    expect(currentInteractionService.onSubmit).not.toHaveBeenCalled();
    expect(component.errorMessageI18nKey).toEqual(
      'I18N_INTERACTIONS_ITEM_SELECTION_NO_RESPONSE');
  });
});
