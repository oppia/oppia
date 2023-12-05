// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Concept Card Manager service.
 */

import { EventEmitter } from '@angular/core';
import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { StateCard } from 'domain/state_card/state-card.model';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { ConceptCardManagerService } from './concept-card-manager.service';
import { ExplorationEngineService } from './exploration-engine.service';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { AudioTranslationLanguageService } from './audio-translation-language.service';

describe('ConceptCardManager service', () => {
  let ccms: ConceptCardManagerService;
  let pps: PlayerPositionService;
  let ees: ExplorationEngineService;
  let stateObjectFactory: StateObjectFactory;
  let mockNewCardOpenedEmitter = new EventEmitter<StateCard>();
  let mockNewCardAvailableEmitter = new EventEmitter();
  let interactionObjectFactory: InteractionObjectFactory;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let stateCard: StateCard;

  const WAIT_BEFORE_REALLY_STUCK_MSEC: number = 160000;
  const WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC: number = 500;
  const WAIT_FOR_CONCEPT_CARD_MSEC: number = 60000;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ]
    });
    pps = TestBed.inject(PlayerPositionService);
    ees = TestBed.inject(ExplorationEngineService);
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    spyOn(pps, 'onNewCardAvailable').and.returnValue(
      mockNewCardAvailableEmitter);
    spyOn(pps, 'onNewCardOpened').and.returnValue(
      mockNewCardOpenedEmitter);
    ccms = TestBed.inject(ConceptCardManagerService);
    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService);
  }));

  beforeEach(() => {
    stateCard = StateCard.createNewCard(
      'State 2', '<p>Content</p>', '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict({
        id: 'TextInput',
        answer_groups: [
          {
            outcome: {
              dest: 'State',
              dest_if_really_stuck: null,
              feedback: {
                html: '',
                content_id: 'This is a new feedback text',
              },
              refresher_exploration_id: 'test',
              missing_prerequisite_skill_id: 'test_skill_id',
              labelled_as_correct: true,
              param_changes: [],
            },
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: '',
          },
        ],
        default_outcome: {
          dest: 'Hola',
          dest_if_really_stuck: null,
          feedback: {
            content_id: '',
            html: '',
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: 'test',
          missing_prerequisite_skill_id: 'test_skill_id',
        },
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: true,
          },
          placeholder: {
            value: 1,
          }
        },
        hints: [],
        solution: {
          answer_is_exclusive: true,
          correct_answer: 'test_answer',
          explanation: {
            content_id: '2',
            html: 'test_explanation1',
          },
        }
      }),
      RecordedVoiceovers.createEmpty(),
      'content', audioTranslationLanguageService);
  });

  it('should show concept card icon at the right time', fakeAsync(() => {
    // Case when no hints exist.
    spyOn(ccms, 'conceptCardForStateExists').and.returnValue(true);
    ccms.hintsAvailable = 0;
    expect(ccms.isConceptCardTooltipOpen()).toBe(false);
    expect(ccms.isConceptCardViewable()).toBe(false);
    expect(ccms.isConceptCardConsumed()).toBe(false);

    ccms.reset(stateCard);

    // Time delay before concept card is released.
    tick(WAIT_FOR_CONCEPT_CARD_MSEC);
    // Time delay before tooltip for the concept card is shown.
    tick(WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);

    expect(ccms.isConceptCardTooltipOpen()).toBe(true);
    expect(ccms.isConceptCardViewable()).toBe(true);
    expect(ccms.isConceptCardConsumed()).toBe(false);
  }));

  it('should not show concept card when hints exist', fakeAsync(() => {
    // Case when hints exist.
    ccms.hintsAvailable = 1;
    spyOn(ccms, 'conceptCardForStateExists').and.returnValue(true);
    expect(ccms.isConceptCardTooltipOpen()).toBe(false);
    expect(ccms.isConceptCardViewable()).toBe(false);
    expect(ccms.isConceptCardConsumed()).toBe(false);

    ccms.reset(stateCard);

    // Time delay before concept card is released.
    tick(WAIT_FOR_CONCEPT_CARD_MSEC);
    // Time delay before tooltip for the concept card is shown.
    tick(WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);

    expect(ccms.isConceptCardTooltipOpen()).toBe(false);
    expect(ccms.isConceptCardViewable()).toBe(false);
    expect(ccms.isConceptCardConsumed()).toBe(false);
  }));

  it('should reset the service when timeouts was called before',
    fakeAsync(() => {
      // Initialize the service with two hints and a solution.
      spyOn(ccms, 'conceptCardForStateExists').and.returnValue(true);
      ccms.reset(stateCard);

      // Set timeout.
      tick(WAIT_FOR_CONCEPT_CARD_MSEC);
      // Set tooltipTimeout.
      tick(WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);

      // Reset service to 0 solutions so releaseHint timeout won't be called.
      ccms.reset(stateCard);

      // There is no timeout to flush. timeout and tooltipTimeout variables
      // were cleaned.
      expect(flush()).toBe(60000);
    }));

  it('should return if concept card for the state with the new name exists',
    fakeAsync(() => {
      const endState = {
        classifier_model_id: null,
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {}
          }
        },
        solicit_answer_details: false,
        interaction: {
          solution: null,
          confirmed_unclassified_answers: [],
          id: 'EndExploration',
          hints: [],
          customization_args: {
            recommendedExplorationIds: {
              value: ['recommendedExplorationId']
            }
          },
          answer_groups: [],
          default_outcome: null
        },
        param_changes: [],
        next_content_id_index: 0,
        card_is_checkpoint: false,
        linked_skill_id: 'Id',
        content: {
          content_id: 'content',
          html: 'Congratulations, you have finished!'
        }
      };
      spyOn(ees, 'getStateFromStateName').withArgs('State 2')
        .and.returnValue(
          stateObjectFactory.createFromBackendDict('End', endState));

      ccms.hintsAvailable = 0;
      ccms.reset(stateCard);

      // Time delay before concept card is released.
      tick(WAIT_FOR_CONCEPT_CARD_MSEC);
      // Time delay before tooltip for the concept card is shown.
      tick(WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);

      expect(ccms.isConceptCardTooltipOpen()).toBe(true);
      expect(ccms.isConceptCardViewable()).toBe(true);
      expect(ccms.isConceptCardConsumed()).toBe(false);
    }));

  it('should set the number of hints available', fakeAsync(() => {
    spyOn(pps.onNewCardOpened, 'subscribe');
    pps.onNewCardOpened.emit(stateCard);
    expect(ccms.hintsAvailable).toEqual(0);
  }));

  it('should emit learner stuckness', fakeAsync(() => {
    ccms.learnerIsReallyStuck = false;
    ccms.emitLearnerStuckedness();
    expect(ccms.learnerIsReallyStuck).toEqual(true);
  }));

  it('should correctly consume concept card', fakeAsync(() => {
    ccms.learnerIsReallyStuck = false;
    ccms.consumeConceptCard();

    expect(ccms.conceptCardDiscovered).toEqual(true);
    expect(ccms.tooltipIsOpen).toEqual(false);
    expect(ccms.conceptCardConsumed).toEqual(true);
    expect(ccms.wrongAnswersSinceConceptCardConsumed).toEqual(0);
    tick(WAIT_BEFORE_REALLY_STUCK_MSEC);
    expect(ccms.learnerIsReallyStuck).toEqual(true);
  }));

  it('should record the wrong answer twice', fakeAsync(() => {
    // Initialize the service with two hints and a solution.
    spyOn(ccms, 'conceptCardForStateExists').and.returnValue(true);
    ccms.reset(stateCard);

    expect(ccms.isConceptCardTooltipOpen()).toBe(false);
    expect(ccms.isConceptCardViewable()).toBe(false);

    // Time delay before concept card is released.
    tick(WAIT_FOR_CONCEPT_CARD_MSEC);
    // Time delay before tooltip for the concept card is shown.
    tick(WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);

    expect(ccms.isConceptCardTooltipOpen()).toBe(true);
    expect(ccms.isConceptCardViewable()).toBe(true);
    ccms.consumeConceptCard();

    ccms.recordWrongAnswer();
    ccms.recordWrongAnswer();
    ccms.recordWrongAnswer();
    ccms.recordWrongAnswer();

    expect(ccms.learnerIsReallyStuck).toEqual(true);
    flush();
  }));

  it('should fetch EventEmitter for consumption of hint', () => {
    let mockOnLearnerGetsReallyStuck = new EventEmitter();
    expect(ccms.onLearnerGetsReallyStuck).toEqual(mockOnLearnerGetsReallyStuck);
  });
});
