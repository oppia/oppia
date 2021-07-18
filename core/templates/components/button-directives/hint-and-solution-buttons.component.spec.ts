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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, EventEmitter } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { WrittenTranslationsObjectFactory } from 'domain/exploration/WrittenTranslationsObjectFactory';
import { StateCardObjectFactory, StateCard } from 'domain/state_card/StateCardObjectFactory';
import { ExplorationPlayerStateService } from 'pages/exploration-player-page/services/exploration-player-state.service';
import { HintAndSolutionModalService } from 'pages/exploration-player-page/services/hint-and-solution-modal.service';
import { HintsAndSolutionManagerService } from 'pages/exploration-player-page/services/hints-and-solution-manager.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { StatsReportingService } from 'pages/exploration-player-page/services/stats-reporting.service';
import { HintAndSolutionButtonsComponent } from './hint-and-solution-buttons.component';
import { MockTranslatePipe } from 'tests/unit-test-utils';

/**
 * @fileoverview Unit tests for HintAndSolutionButtonsComponent
 */

describe('HintAndSolutionButtonsComponent', () => {
  let component: HintAndSolutionButtonsComponent;
  let fixture: ComponentFixture<HintAndSolutionButtonsComponent>;
  let playerPositionService: PlayerPositionService;
  let hintsAndSolutionManagerService: HintsAndSolutionManagerService;
  let writtenTranslationsObjectFactory: WrittenTranslationsObjectFactory;
  let interactionObjectFactory: InteractionObjectFactory;
  let playerTranscriptService: PlayerTranscriptService;
  let hintAndSolutionModalService: HintAndSolutionModalService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let statsReportingService: StatsReportingService;
  let stateCardObjectFactory: StateCardObjectFactory;

  let newCard: StateCard;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [HintAndSolutionButtonsComponent, MockTranslatePipe]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HintAndSolutionButtonsComponent);
    component = fixture.componentInstance;
    playerPositionService = TestBed.inject(PlayerPositionService);
    hintsAndSolutionManagerService = TestBed
      .inject(HintsAndSolutionManagerService);
    writtenTranslationsObjectFactory = TestBed.inject(
      WrittenTranslationsObjectFactory);
    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    stateCardObjectFactory = TestBed.inject(StateCardObjectFactory);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    hintAndSolutionModalService = TestBed.inject(HintAndSolutionModalService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService);
    statsReportingService = TestBed.inject(StatsReportingService);

    spyOn(playerPositionService, 'onNewCardOpened').and.returnValue(
      new EventEmitter<StateCard>());
    spyOn(playerPositionService, 'onActiveCardChanged').and.returnValue(
      new EventEmitter<void>());
    spyOn(hintsAndSolutionManagerService, 'onHintConsumed').and.returnValue(
      new EventEmitter<void>());
    spyOn(hintsAndSolutionManagerService, 'onSolutionViewedEventEmitter')
      .and.returnValue(new EventEmitter<void>());

    // A StateCard which supports hints.
    newCard = stateCardObjectFactory.createNewCard(
      'State 2', '<p>Content</p>', '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict({
        id: 'TextInput',
        answer_groups: [
          {
            outcome: {
              dest: 'State',
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
      writtenTranslationsObjectFactory.createEmpty(),
      'content');
  });

  it('should subscribe to events on initialization', () => {
    spyOn(playerPositionService.onNewCardOpened, 'subscribe');
    spyOn(playerPositionService.onActiveCardChanged, 'subscribe');
    spyOn(hintsAndSolutionManagerService.onHintConsumed, 'subscribe');
    spyOn(
      hintsAndSolutionManagerService.onSolutionViewedEventEmitter, 'subscribe');

    component.ngOnInit();

    expect(playerPositionService.onNewCardOpened.subscribe).toHaveBeenCalled();
    expect(playerPositionService.onActiveCardChanged.subscribe)
      .toHaveBeenCalled();
    expect(hintsAndSolutionManagerService.onHintConsumed.subscribe)
      .toHaveBeenCalled();
    expect(
      hintsAndSolutionManagerService.onSolutionViewedEventEmitter.subscribe)
      .toHaveBeenCalled();
  });

  it('should reset hints and solutions when new' +
    ' card is opened', fakeAsync(() => {
    let oldCard: StateCard = stateCardObjectFactory.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      null, RecordedVoiceovers.createEmpty(),
      writtenTranslationsObjectFactory.createEmpty(),
      'content');
    spyOn(hintsAndSolutionManagerService, 'getNumHints').and.returnValue(1);

    component.displayedCard = oldCard;

    component.ngOnInit();
    playerPositionService.onNewCardOpened.emit(newCard);
    tick();

    expect(component.displayedCard).toEqual(newCard);
  }));

  it('should reset local hints array if active card is' +
    ' changed to the last one', fakeAsync(() => {
    spyOn(playerTranscriptService, 'isLastCard').and.returnValue(true);
    spyOn(component, 'resetLocalHintsArray');

    component.ngOnInit();
    playerPositionService.onActiveCardChanged.emit();
    tick();

    expect(component.resetLocalHintsArray).toHaveBeenCalledTimes(2);
    component.ngOnDestroy();
  }));

  it('should not reset local hints array if new active card is' +
    ' not the last one', fakeAsync(() => {
    spyOn(playerTranscriptService, 'isLastCard').and.returnValue(false);
    spyOn(component, 'resetLocalHintsArray');

    component.ngOnInit();
    playerPositionService.onActiveCardChanged.emit();
    tick();

    expect(component.resetLocalHintsArray).toHaveBeenCalledTimes(1);
    component.ngOnDestroy();
  }));

  it('should fire change detection when hint is used', fakeAsync(() => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');

    component.ngOnInit();
    hintsAndSolutionManagerService.onHintConsumed.emit();
    tick();

    expect(detectChangesSpy).toHaveBeenCalled();
    component.ngOnDestroy();
  }));

  it('should fire change detection when solution is viewed', fakeAsync(() => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');

    component.ngOnInit();
    hintsAndSolutionManagerService.onSolutionViewedEventEmitter.emit();
    tick();

    expect(detectChangesSpy).toHaveBeenCalled();
    component.ngOnDestroy();
  }));

  it('should show hint button if hint is viewable and displayed card\'s' +
    ' interaction supports hints', () => {
    spyOn(hintsAndSolutionManagerService, 'isHintViewable')
      .and.returnValues(false, true, true);

    component.displayedCard = null;

    expect(component.isHintButtonVisible(0)).toBe(false);

    // StateCard with EndExploration interaction, which does not supports hints.
    component.displayedCard = stateCardObjectFactory.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict({
        id: 'EndExploration',
        answer_groups: [],
        default_outcome: null,
        confirmed_unclassified_answers: [],
        customization_args: {},
        hints: [],
        solution: null,
      }), RecordedVoiceovers.createEmpty(),
      writtenTranslationsObjectFactory.createEmpty(), 'content');

    expect(component.isHintButtonVisible(0)).toBe(false);

    // StateCard which supports hints.
    component.displayedCard = newCard;

    expect(component.isHintButtonVisible(0)).toBe(true);
  });

  it('should show solution button if solution is released', () => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionViewable')
      .and.returnValue(true);

    expect(component.isSolutionButtonVisible()).toBe(true);
  });

  it('should show solution button if solution is released', () => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionViewable')
      .and.returnValue(true);

    expect(component.isSolutionButtonVisible()).toBe(true);
  });

  it('should not show solution button if solution is not released', () => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionViewable')
      .and.returnValue(false);

    expect(component.isSolutionButtonVisible()).toBe(false);
  });

  it('should display hint modal when user clicks on hints icon',
    fakeAsync(() => {
      spyOn(hintAndSolutionModalService, 'displayHintModal').and.returnValue(
        <NgbModalRef>{
          result: Promise.resolve('success')
        }
      );

      expect(component.activeHintIndex).toBe(undefined);
      expect(component.isVisible).toBe(true);

      component.displayHintModal(0);

      expect(component.activeHintIndex).toBe(0);
      expect(component.isVisible).toBe(false);
    }));

  it('should close display hint modal and reset active hint index when modal' +
    ' is closed', fakeAsync(() => {
    spyOn(hintAndSolutionModalService, 'displayHintModal').and.returnValue(
      <NgbModalRef>{
        result: Promise.reject('failure')
      }
    );

    expect(component.activeHintIndex).toBe(undefined);
    expect(component.isVisible).toBe(true);

    component.displayHintModal(0);
    tick();

    expect(component.activeHintIndex).toBe(null);
    expect(component.isVisible).toBe(false);
  }));

  it('should display solution modal if solution is' +
    ' already consumed', fakeAsync(() => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionConsumed').and.returnValue(
      true);
    spyOn(explorationPlayerStateService, 'isInQuestionMode').and.returnValue(
      false);
    spyOn(statsReportingService, 'recordSolutionHit');
    spyOn(playerPositionService, 'getCurrentStateName')
      .and.returnValue('state1');
    spyOn(hintAndSolutionModalService, 'displaySolutionModal').and.returnValue(
      <NgbModalRef>{
        result: Promise.resolve('success')
      }
    );

    expect(component.solutionModalIsActive).toBe(false);

    component.onClickSolutionButton();
    tick();

    expect(component.solutionModalIsActive).toBe(true);
  }));

  it('should close solution modal', fakeAsync(() => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionConsumed').and.returnValue(
      true);
    spyOn(explorationPlayerStateService, 'isInQuestionMode').and.returnValue(
      false);
    spyOn(statsReportingService, 'recordSolutionHit');
    spyOn(playerPositionService, 'getCurrentStateName')
      .and.returnValue('state1');
    spyOn(hintAndSolutionModalService, 'displaySolutionModal').and.returnValue(
      <NgbModalRef>{
        result: Promise.reject()
      }
    );

    component.onClickSolutionButton();
    tick();

    expect(component.solutionModalIsActive).toBe(false);
  }));

  it('should open interstitial modal if solution has not' +
    ' been consumed before and then display solution modal' +
    ' after user confirms', fakeAsync(() => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionConsumed').and.returnValue(
      false);
    spyOn(hintAndSolutionModalService, 'displaySolutionInterstitialModal')
      .and.returnValue(
        <NgbModalRef>{
          result: Promise.resolve('success')
        }
      );
    spyOn(component, 'displaySolutionModal').and.callFake(() => {});

    component.onClickSolutionButton();
    tick();

    expect(component.displaySolutionModal).toHaveBeenCalled();
  }));

  it('should close interstitial modal if solution has not' +
    ' been consumed before and user click cancel', fakeAsync(() => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionConsumed').and.returnValue(
      false);
    spyOn(hintAndSolutionModalService, 'displaySolutionInterstitialModal')
      .and.returnValue(
        <NgbModalRef>{
          result: Promise.reject('failure')
        }
      );
    spyOn(component, 'displaySolutionModal').and.callFake(() => {});

    component.solutionModalIsActive = true;
    component.onClickSolutionButton();
    tick();

    expect(component.solutionModalIsActive).toBe(false);
    expect(component.displaySolutionModal).not.toHaveBeenCalled();
  }));

  it('should show \'Need help? View a hint for this' +
    ' problem!\' tooltip', () => {
    spyOn(hintsAndSolutionManagerService, 'isHintTooltipOpen')
      .and.returnValues(true, false);

    expect(component.isTooltipVisible()).toBe(true);
    expect(component.isTooltipVisible()).toBe(false);
  });

  it('should show if hint is consumed or not', () => {
    spyOn(hintsAndSolutionManagerService, 'isHintConsumed')
      .and.returnValues(true, false);

    expect(component.isHintConsumed(0)).toBe(true);
    expect(component.isHintConsumed(0)).toBe(false);
  });

  it('should show solution is consumed or not', () => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionConsumed')
      .and.returnValues(true, false);

    expect(component.isSolutionConsumed()).toBe(true);
    expect(component.isSolutionConsumed()).toBe(false);
  });
});
