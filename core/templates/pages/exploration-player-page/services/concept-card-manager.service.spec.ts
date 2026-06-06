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

import {EventEmitter} from '@angular/core';
import {TestBed, fakeAsync, flush, tick} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from '../../../components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {StateCard} from '../../../domain/state_card/state-card.model';
import {ConceptCard} from '../../../domain/skill/concept-card.model';
import {PlayerPositionService} from './player-position.service';
import {ConceptCardManagerService} from './concept-card-manager.service';
import {ExplorationEngineService} from './exploration-engine.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {State} from '../../../domain/state/state.model';
import {Interaction} from '../../../domain/exploration/interaction.model';
import {RecordedVoiceovers} from '../../../domain/exploration/recorded-voiceovers.model';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

class MockNgbModalRef {
  componentInstance = {
    skillId: null,
    explorationId: null,
  };
}

describe('ConceptCardManager service', () => {
  let ccms: ConceptCardManagerService;
  let pps: PlayerPositionService;
  let ees: ExplorationEngineService;
  let pts: PlayerTranscriptService;
  let mockNewCardOpenedEmitter = new EventEmitter<StateCard>();
  let mockNewCardAvailableEmitter = new EventEmitter();
  let stateCard: StateCard;
  let stateCardWithHints: StateCard;
  let ngbModal: NgbModal;
  let mockConceptCard: ConceptCard;

  const WAIT_BEFORE_REALLY_STUCK_MSEC: number = 160000;
  const WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC: number = 500;
  const WAIT_FOR_CONCEPT_CARD_MSEC: number = 60000;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
    });
    pps = TestBed.inject(PlayerPositionService);
    ees = TestBed.inject(ExplorationEngineService);
    pts = TestBed.inject(PlayerTranscriptService);
    spyOn(pps, 'onNewCardAvailable').and.returnValue(
      mockNewCardAvailableEmitter
    );
    spyOn(pps, 'onNewCardOpened').and.returnValue(mockNewCardOpenedEmitter);
    ccms = TestBed.inject(ConceptCardManagerService);
    ngbModal = TestBed.inject(NgbModal);
  }));

  beforeEach(() => {
    stateCard = StateCard.createNewCard(
      'State 2',
      '<p>Content</p>',
      '<interaction></interaction>',
      Interaction.createFromBackendDict({
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
          },
        },
        hints: [],
        solution: {
          answer_is_exclusive: true,
          correct_answer: 'test_answer',
          explanation: {
            content_id: '2',
            html: 'test_explanation1',
          },
        },
      }),
      RecordedVoiceovers.createEmpty(),
      'content'
    );

    stateCardWithHints = StateCard.createNewCard(
      'State 3',
      '<p>Content</p>',
      '<interaction></interaction>',
      Interaction.createFromBackendDict({
        id: 'TextInput',
        answer_groups: [],
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
          },
        },
        hints: [
          {
            hint_content: {
              content_id: 'hint_1',
              html: 'This is a hint',
            },
          },
        ],
        solution: null,
      }),
      RecordedVoiceovers.createEmpty(),
      'content'
    );

    mockConceptCard = {
      getExplanation: () => ({
        getHtml: () => 'Test explanation',
      }),
      getWorkedExamples: () => [],
      getSkillDescription: () => 'Test skill',
    } as ConceptCard;
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

  it('should open concept card modal', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockNgbModalRef,
        result: Promise.resolve(),
      } as NgbModalRef;
    });
    ccms.openConceptCardModal('linkedSkillId');
    expect(modalSpy).toHaveBeenCalled();
  });

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

  it('should reset the service when timeouts was called before', fakeAsync(() => {
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

  it('should return if concept card for the state with the new name exists', fakeAsync(() => {
    const endState = {
      classifier_model_id: null,
      solicit_answer_details: false,
      interaction: {
        solution: null,
        confirmed_unclassified_answers: [],
        id: 'EndExploration',
        hints: [],
        customization_args: {
          recommendedExplorationIds: {
            value: ['recommendedExplorationId'],
          },
        },
        answer_groups: [],
        default_outcome: null,
      },
      param_changes: [],
      next_content_id_index: 0,
      card_is_checkpoint: false,
      linked_skill_id: 'Id',
      inapplicable_skill_misconception_ids: [],
      content: {
        content_id: 'content',
        html: 'Congratulations, you have finished!',
      },
    };
    spyOn(ees, 'getStateFromStateName')
      .withArgs('State 2')
      .and.returnValue(State.createFromBackendDict('End', endState));

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

  it('should return false if concept card for state does not exist', () => {
    const stateWithoutLinkedSkill = {
      classifier_model_id: null,
      solicit_answer_details: false,
      interaction: {
        solution: null,
        confirmed_unclassified_answers: [],
        id: 'TextInput',
        hints: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: 'Enter text here',
          },
        },
        answer_groups: [],
        default_outcome: null,
      },
      param_changes: [],
      next_content_id_index: 0,
      card_is_checkpoint: false,
      linked_skill_id: null,
      inapplicable_skill_misconception_ids: [],
      content: {
        content_id: 'content',
        html: 'Test content',
      },
    };
    spyOn(ees, 'getStateFromStateName')
      .withArgs('State 2')
      .and.returnValue(
        State.createFromBackendDict('State2', stateWithoutLinkedSkill)
      );

    expect(ccms.conceptCardForStateExists(stateCard)).toBe(false);
  });

  it('should set the number of hints available', fakeAsync(() => {
    spyOn(pps.onNewCardOpened, 'subscribe');
    pps.onNewCardOpened.emit(stateCardWithHints);
    expect(ccms.hintsAvailable).toEqual(1);
  }));

  it('should emit learner stuckness', fakeAsync(() => {
    ccms.learnerIsReallyStuck = false;
    ccms.emitLearnerStuckedness();
    expect(ccms.learnerIsReallyStuck).toEqual(true);
  }));

  it('should not emit learner stuckness if already stuck', fakeAsync(() => {
    ccms.learnerIsReallyStuck = true;
    let emissionCount = 0;
    ccms.onLearnerGetsReallyStuck.subscribe(() => {
      emissionCount++;
    });
    ccms.emitLearnerStuckedness();
    expect(emissionCount).toBe(0);
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

  it('should clear tooltip timeout when consuming concept card', fakeAsync(() => {
    ccms.tooltipTimeout = setTimeout(() => {}, 1000);
    ccms.consumeConceptCard();
    expect(ccms.tooltipTimeout).toBeNull();
    flush();
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

  it('should not record wrong answer if concept card is not viewable', () => {
    ccms.conceptCardReleased = false;
    ccms.wrongAnswersSinceConceptCardConsumed = 0;
    ccms.recordWrongAnswer();
    expect(ccms.wrongAnswersSinceConceptCardConsumed).toEqual(0);
  });

  it('should set and get concept card', () => {
    ccms.setConceptCard(mockConceptCard);
    expect(ccms.getConceptCard()).toEqual(mockConceptCard);
  });

  it('should return to exploration after concept card', () => {
    spyOn(pts, 'addPreviousCard');
    spyOn(pts, 'getNumCards').and.returnValue(5);
    spyOn(pps, 'setDisplayedCardIndex');

    ccms.returnToExplorationAfterConceptCard();

    expect(pts.addPreviousCard).toHaveBeenCalled();
    expect(pts.getNumCards).toHaveBeenCalled();
    expect(pps.setDisplayedCardIndex).toHaveBeenCalledWith(4);
  });

  it('should enqueue timeout and clear previous timeout', fakeAsync(() => {
    let mockFunction = jasmine.createSpy('mockFunction');
    ccms.enqueueTimeout(mockFunction, 1000);

    // Enqueue another timeout which should clear the first one.
    ccms.enqueueTimeout(mockFunction, 2000);

    tick(1000);
    expect(mockFunction).not.toHaveBeenCalled();

    tick(1000);
    expect(mockFunction).toHaveBeenCalledTimes(1);
  }));

  it('should show tooltip and mark concept card as discovered', () => {
    let timeoutElapsedEmitted = false;
    ccms.onTimeoutElapsed$.subscribe(() => {
      timeoutElapsedEmitted = true;
    });
    ccms.tooltipIsOpen = false;
    ccms.conceptCardDiscovered = false;

    ccms.showTooltip();

    expect(ccms.tooltipIsOpen).toBe(true);
    expect(ccms.conceptCardDiscovered).toBe(true);
    expect(timeoutElapsedEmitted).toBe(true);
  });

  it('should release concept card and emit timeout elapsed', fakeAsync(() => {
    let timeoutElapsedEmitted = false;
    ccms.onTimeoutElapsed$.subscribe(() => {
      timeoutElapsedEmitted = true;
    });
    ccms.conceptCardReleased = false;
    ccms.conceptCardDiscovered = false;
    ccms.tooltipTimeout = null;

    ccms.releaseConceptCard();

    expect(ccms.conceptCardReleased).toBe(true);
    expect(timeoutElapsedEmitted).toBe(true);

    tick(WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);
    expect(ccms.tooltipIsOpen).toBe(true);
  }));

  it('should not set tooltip timeout if concept card already discovered', () => {
    ccms.conceptCardReleased = false;
    ccms.conceptCardDiscovered = true;
    ccms.tooltipTimeout = null;

    ccms.releaseConceptCard();

    expect(ccms.tooltipTimeout).toBeNull();
  });

  it('should not set tooltip timeout if tooltip timeout already exists', () => {
    ccms.conceptCardReleased = false;
    ccms.conceptCardDiscovered = false;
    ccms.tooltipTimeout = setTimeout(() => {}, 1000);

    ccms.releaseConceptCard();

    expect(ccms.tooltipTimeout).not.toBeNull();
  });

  it('should fetch EventEmitter for consumption of hint', () => {
    let mockOnLearnerGetsReallyStuck = new EventEmitter();
    expect(ccms.onLearnerGetsReallyStuck).toEqual(mockOnLearnerGetsReallyStuck);
  });

  it('should subscribe to onTimeoutElapsed observable', () => {
    expect(ccms.onTimeoutElapsed$).toBeDefined();
  });
});
