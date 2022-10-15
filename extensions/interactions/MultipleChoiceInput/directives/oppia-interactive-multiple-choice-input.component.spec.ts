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
import { BrowserCheckerService } from 'domain/utilities/browser-checker.service';
import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { AudioTranslationLanguageService } from 'pages/exploration-player-page/services/audio-translation-language.service';
import { StateCard } from 'domain/state_card/state-card.model';

describe('InteractiveMultipleChoiceInputComponent', () => {
  let component: InteractiveMultipleChoiceInputComponent;
  let fixture: ComponentFixture<InteractiveMultipleChoiceInputComponent>;
  let currentInteractionService: CurrentInteractionService;
  let browserCheckerService: BrowserCheckerService;
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

    registerCurrentInteraction(submitAnswerFn, validateExpressionFn) {
      submitAnswerFn();
      validateExpressionFn();
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveMultipleChoiceInputComponent],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: MockInteractionAttributesExtractorService
        },
        {
          provide: CurrentInteractionService,
          useClass: MockCurrentInteractionService
        },
        BrowserCheckerService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    browserCheckerService = TestBed.inject(BrowserCheckerService);
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
    component.ngOnInit();

    expect(component.choices).toEqual([
      {
        originalIndex: 0,
        value: '<p>opt1</p>'
      },
      {
        originalIndex: 1,
        value: '<p>opt2</p>'
      },
      {
        originalIndex: 2,
        value: '<p>opt3</p>'
      },
      {
        originalIndex: 3,
        value: '<p>opt4</p>'
      }
    ]);

    expect(component.answer).toBeNull();
    expect(currentInteractionService.registerCurrentInteraction)
      .toHaveBeenCalled();
  });

  it('should initalise component when user selects multiple choice ' +
  'interaction', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction')
      .and.callThrough();
    spyOn(playerTranscriptService, 'getCard').and.returnValue(displayedCard);
    component.showChoicesInShuffledOrderWithValue = 'true';

    component.ngOnInit();

    // We cannot test if the choices have been shuffled because
    // each time a different order will come. Since the shuffling is random
    // there is a possibility that the choices may not be shuffled.
    // Therefore testing the order can result in flakiness in the
    // frontend tests.
  });

  it('should update selected answer when user selects an option', () => {
    let dummyMouseEvent = new MouseEvent('Mouse');
    spyOn(browserCheckerService, 'isMobileDevice').and.returnValue(false);
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
    spyOn(component, 'submitAnswer');

    component.selectAnswer(dummyMouseEvent, '1');

    expect(component.answer).toBe(1);
    expect(component.submitAnswer).toHaveBeenCalled();
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
    spyOn(browserCheckerService, 'isMobileDevice').and.returnValue(true);
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
  });

  it('should submit answer when user submits answer', () => {
    component.answer = 1;
    spyOn(currentInteractionService, 'onSubmit').and.callThrough();

    component.submitAnswer();

    expect(currentInteractionService.onSubmit).toHaveBeenCalled();
  });

  it('should not submit answer when no answer is selected', () => {
    component.answer = null;
    spyOn(currentInteractionService, 'onSubmit').and.callThrough();

    component.submitAnswer();

    expect(currentInteractionService.onSubmit).not.toHaveBeenCalled();
  });
});
