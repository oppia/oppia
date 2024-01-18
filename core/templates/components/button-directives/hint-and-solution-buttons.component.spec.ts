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
 * @fileoverview Unit tests for HintAndSolutionButtonsComponent
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, EventEmitter } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { Interaction, InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { StateCard } from 'domain/state_card/state-card.model';
import { AudioTranslationLanguageService } from 'pages/exploration-player-page/services/audio-translation-language.service';
import { ExplorationPlayerStateService } from 'pages/exploration-player-page/services/exploration-player-state.service';
import { HintAndSolutionModalService } from 'pages/exploration-player-page/services/hint-and-solution-modal.service';
import { HintsAndSolutionManagerService } from 'pages/exploration-player-page/services/hints-and-solution-manager.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { StatsReportingService } from 'pages/exploration-player-page/services/stats-reporting.service';
import { HintAndSolutionButtonsComponent } from './hint-and-solution-buttons.component';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

describe('HintAndSolutionButtonsComponent', () => {
  let component: HintAndSolutionButtonsComponent;
  let fixture: ComponentFixture<HintAndSolutionButtonsComponent>;
  let playerPositionService: PlayerPositionService;
  let hintsAndSolutionManagerService: HintsAndSolutionManagerService;
  let interactionObjectFactory: InteractionObjectFactory;
  let playerTranscriptService: PlayerTranscriptService;
  let hintAndSolutionModalService: HintAndSolutionModalService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let statsReportingService: StatsReportingService;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  let newCard: StateCard;
  let audioTranslationLanguageService: AudioTranslationLanguageService;

  const defaultInteractionBackendDict = {
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
      catchMisspellings: {
        value: false
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
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [HintAndSolutionButtonsComponent, MockTranslatePipe],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HintAndSolutionButtonsComponent);
    component = fixture.componentInstance;
    playerPositionService = TestBed.inject(PlayerPositionService);
    hintsAndSolutionManagerService = TestBed
      .inject(HintsAndSolutionManagerService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    hintAndSolutionModalService = TestBed.inject(HintAndSolutionModalService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService);
    statsReportingService = TestBed.inject(StatsReportingService);
    audioTranslationLanguageService = (
      TestBed.inject(AudioTranslationLanguageService));

    spyOn(playerPositionService, 'onNewCardOpened').and.returnValue(
      new EventEmitter<StateCard>());
    spyOn(playerPositionService, 'onActiveCardChanged').and.returnValue(
      new EventEmitter<void>());
    spyOn(hintsAndSolutionManagerService, 'onHintConsumed').and.returnValue(
      new EventEmitter<void>());
    spyOn(hintsAndSolutionManagerService, 'onSolutionViewedEventEmitter')
      .and.returnValue(new EventEmitter<void>());
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);

    // A StateCard which supports hints.
    newCard = StateCard.createNewCard(
      'State 2', '<p>Content</p>', '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict(
        defaultInteractionBackendDict),
      RecordedVoiceovers.createEmpty(),
      'content', audioTranslationLanguageService);
  });

  it('should reset hints when solution doesn\'t exist', () => {
    const interactionDict = JSON.parse(
      JSON.stringify(defaultInteractionBackendDict));
    interactionDict.solution = null;
    const interaction =
      interactionObjectFactory.createFromBackendDict(interactionDict);
    const card = StateCard.createNewCard(
      'Card 1', 'Content html', 'Interaction html',
      interaction, RecordedVoiceovers.createEmpty(), 'content',
      audioTranslationLanguageService
    );
    spyOn(component, 'resetLocalHintsArray');

    component.ngOnInit();
    playerPositionService.onNewCardOpened.emit(card);

    expect(component.resetLocalHintsArray).toHaveBeenCalledTimes(2);
  });

  it('should reset hints when solution exists', () => {
    const interaction = interactionObjectFactory.createFromBackendDict(
      defaultInteractionBackendDict);
    const card = StateCard.createNewCard(
      'Card 1', 'Content html', 'Interaction html',
      interaction, RecordedVoiceovers.createEmpty(), 'content',
      audioTranslationLanguageService
    );
    spyOn(component, 'resetLocalHintsArray');

    component.ngOnInit();
    playerPositionService.onNewCardOpened.emit(card);

    expect(component.resetLocalHintsArray).toHaveBeenCalledTimes(2);
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
    let oldCard: StateCard = StateCard.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      {} as Interaction, RecordedVoiceovers.createEmpty(),
      'content', audioTranslationLanguageService);
    spyOn(hintsAndSolutionManagerService, 'getNumHints').and.returnValue(1);

    component.displayedCard = oldCard;

    component.ngOnInit();
    playerPositionService.onNewCardOpened.emit(newCard);
    tick();

    expect(component.displayedCard).toEqual(newCard);
  }));

  it('should get RTL language status correctly', () => {
    expect(component.isLanguageRTL()).toBeTrue();
  });

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

    expect(component.isHintButtonVisible(0)).toBe(false);

    // StateCard with EndExploration interaction, which does not supports hints.
    component.displayedCard = StateCard.createNewCard(
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
      'content',
      audioTranslationLanguageService);

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
        {
          result: Promise.resolve('success')
        } as NgbModalRef
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
      {
        result: Promise.reject('failure')
      } as NgbModalRef
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
      {
        result: Promise.resolve('success')
      } as NgbModalRef
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
      {
        result: Promise.reject()
      } as NgbModalRef
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
        {
          result: Promise.resolve('success')
        } as NgbModalRef
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
        {
          result: Promise.reject('failure')
        } as NgbModalRef
      );
    spyOn(component, 'displaySolutionModal').and.callFake(() => {});

    component.solutionModalIsActive = true;
    component.onClickSolutionButton();
    tick();

    expect(component.solutionModalIsActive).toBe(false);
    expect(component.displaySolutionModal).not.toHaveBeenCalled();
  }));

  it('should show \'Would you like to view the complete solution?' +
    ' \' tooltip', () => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionTooltipOpen')
      .and.returnValues(true, false);

    expect(component.isSolutionTooltipVisible()).toBe(true);
    expect(component.isSolutionTooltipVisible()).toBe(false);
  });

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
