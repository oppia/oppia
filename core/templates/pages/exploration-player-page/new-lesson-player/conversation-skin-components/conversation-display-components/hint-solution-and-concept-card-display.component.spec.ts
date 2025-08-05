// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for HintSolutionAndConceptCardDisplayComponent
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ChangeDetectorRef, EventEmitter} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from '../../../../../components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {Interaction} from '../../../../../domain/exploration/interaction.model';
import {RecordedVoiceovers} from '../../../../../domain/exploration/recorded-voiceovers.model';
import {StateCard} from '../../../../../domain/state_card/state-card.model';
import {ExplorationModeService} from '../../../../../pages/exploration-player-page/services/exploration-mode.service';
import {HintAndSolutionModalService} from '../../../../../pages/exploration-player-page/services/hint-and-solution-modal.service';
import {HintsAndSolutionManagerService} from '../../../../../pages/exploration-player-page/services/hints-and-solution-manager.service';
import {PlayerPositionService} from '../../../../../pages/exploration-player-page/services/player-position.service';
import {PlayerTranscriptService} from '../../../../../pages/exploration-player-page/services/player-transcript.service';
import {StatsReportingService} from '../../../../../pages/exploration-player-page/services/stats-reporting.service';
import {HintSolutionAndConceptCardDisplayComponent} from './hint-solution-and-concept-card-display.component';
import {MockTranslatePipe} from '../../../../../tests/unit-test-utils';
import {I18nLanguageCodeService} from '../../../../../services/i18n-language-code.service';
import {ConceptCardManagerService} from '../../../../../pages/exploration-player-page/services/concept-card-manager.service';
import {ExplorationEngineService} from '../../../../../pages/exploration-player-page/services/exploration-engine.service';
import {PageContextService} from '../../../../../services/page-context.service';
import {UrlService} from '../../../../../services/contextual/url.service';

describe('HintSolutionAndConceptCardDisplayComponent', () => {
  let component: HintSolutionAndConceptCardDisplayComponent;
  let fixture: ComponentFixture<HintSolutionAndConceptCardDisplayComponent>;
  let playerPositionService: PlayerPositionService;
  let hintsAndSolutionManagerService: HintsAndSolutionManagerService;
  let playerTranscriptService: PlayerTranscriptService;
  let hintAndSolutionModalService: HintAndSolutionModalService;
  let explorationModeService: ExplorationModeService;
  let statsReportingService: StatsReportingService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let conceptCardManagerService: ConceptCardManagerService;
  let explorationEngineService: ExplorationEngineService;
  let pageContextService: PageContextService;
  let urlService: UrlService;

  let newCard: StateCard;

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
        value: false,
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
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        HintSolutionAndConceptCardDisplayComponent,
        MockTranslatePipe,
      ],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      HintSolutionAndConceptCardDisplayComponent
    );
    component = fixture.componentInstance;
    playerPositionService = TestBed.inject(PlayerPositionService);
    hintsAndSolutionManagerService = TestBed.inject(
      HintsAndSolutionManagerService
    );
    conceptCardManagerService = TestBed.inject(ConceptCardManagerService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    hintAndSolutionModalService = TestBed.inject(HintAndSolutionModalService);
    explorationModeService = TestBed.inject(ExplorationModeService);
    statsReportingService = TestBed.inject(StatsReportingService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    pageContextService = TestBed.inject(PageContextService);
    urlService = TestBed.inject(UrlService);

    spyOn(playerPositionService, 'onNewCardOpened').and.returnValue(
      new EventEmitter<StateCard>()
    );
    spyOn(playerPositionService, 'onActiveCardChanged').and.returnValue(
      new EventEmitter<void>()
    );
    spyOn(hintsAndSolutionManagerService, 'onHintConsumed').and.returnValue(
      new EventEmitter<void>()
    );
    spyOn(
      hintsAndSolutionManagerService,
      'onSolutionViewedEventEmitter'
    ).and.returnValue(new EventEmitter<void>());
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );

    spyOn(conceptCardManagerService, 'reset').and.stub();
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    spyOn(urlService, 'isIframed').and.returnValue(false);

    // A StateCard which supports hints.
    newCard = StateCard.createNewCard(
      'State 2',
      '<p>Content</p>',
      '<interaction></interaction>',
      Interaction.createFromBackendDict(defaultInteractionBackendDict),
      RecordedVoiceovers.createEmpty(),
      'content'
    );
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should initialize component properties on ngOnInit', () => {
    spyOn(hintsAndSolutionManagerService, 'getNumHints').and.returnValue(2);

    component.ngOnInit();

    expect(component._editorPreviewMode).toBe(false);
    expect(component.iframed).toBe(false);
    expect(component.hintIndexes).toEqual([0, 1]);
  });

  it('should initialize component with editor preview mode', () => {
    pageContextService.isInExplorationEditorPage = jasmine
      .createSpy()
      .and.returnValue(true);
    urlService.isIframed = jasmine.createSpy().and.returnValue(true);
    spyOn(hintsAndSolutionManagerService, 'getNumHints').and.returnValue(0);

    component.ngOnInit();

    expect(component._editorPreviewMode).toBe(true);
    expect(component.iframed).toBe(true);
  });

  it('should unsubscribe on destroy', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });

  it('should reset local hints array correctly', () => {
    spyOn(hintsAndSolutionManagerService, 'getNumHints').and.returnValue(3);

    component.resetLocalHintsArray();

    expect(component.hintIndexes).toEqual([0, 1, 2]);
  });

  it("should reset hints when solution doesn't exist", () => {
    const interactionDict = JSON.parse(
      JSON.stringify(defaultInteractionBackendDict)
    );
    interactionDict.solution = null;
    const interaction = Interaction.createFromBackendDict(interactionDict);
    const card = StateCard.createNewCard(
      'Card 1',
      'Content html',
      'Interaction html',
      interaction,
      RecordedVoiceovers.createEmpty(),
      'content'
    );
    spyOn(component, 'resetLocalHintsArray');

    component.ngOnInit();
    playerPositionService.onNewCardOpened.emit(card);

    expect(component.resetLocalHintsArray).toHaveBeenCalledTimes(2);
  });

  it('should reset hints when solution exists', () => {
    const interaction = Interaction.createFromBackendDict(
      defaultInteractionBackendDict
    );
    const card = StateCard.createNewCard(
      'Card 1',
      'Content html',
      'Interaction html',
      interaction,
      RecordedVoiceovers.createEmpty(),
      'content'
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
      hintsAndSolutionManagerService.onSolutionViewedEventEmitter,
      'subscribe'
    );

    component.ngOnInit();

    expect(playerPositionService.onNewCardOpened.subscribe).toHaveBeenCalled();
    expect(
      playerPositionService.onActiveCardChanged.subscribe
    ).toHaveBeenCalled();
    expect(
      hintsAndSolutionManagerService.onHintConsumed.subscribe
    ).toHaveBeenCalled();
    expect(
      hintsAndSolutionManagerService.onSolutionViewedEventEmitter.subscribe
    ).toHaveBeenCalled();
  });

  it(
    'should reset hints and solutions when new' + ' card is opened',
    fakeAsync(() => {
      let oldCard: StateCard = StateCard.createNewCard(
        'State 1',
        '<p>Content</p>',
        '<interaction></interaction>',
        {} as Interaction,
        RecordedVoiceovers.createEmpty(),
        'content'
      );
      spyOn(hintsAndSolutionManagerService, 'getNumHints').and.returnValue(1);
      spyOn(hintsAndSolutionManagerService, 'reset');

      component.displayedCard = oldCard;

      component.ngOnInit();
      playerPositionService.onNewCardOpened.emit(newCard);
      tick();

      expect(component.displayedCard).toEqual(newCard);
      expect(hintsAndSolutionManagerService.reset).toHaveBeenCalledWith(
        newCard.getHints(),
        newCard.getSolution()
      );
      expect(conceptCardManagerService.reset).toHaveBeenCalledWith(newCard);
    })
  );

  it(
    'should reset local hints array if active card is' +
      ' changed to the last one',
    fakeAsync(() => {
      spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(2);
      spyOn(playerTranscriptService, 'isLastCard').and.returnValue(true);
      spyOn(component, 'resetLocalHintsArray');

      component.ngOnInit();
      playerPositionService.onActiveCardChanged.emit();
      tick();

      expect(component.currentlyOnLatestCard).toBe(true);
      expect(component.resetLocalHintsArray).toHaveBeenCalledTimes(2);
      component.ngOnDestroy();
    })
  );

  it(
    'should not reset local hints array if new active card is' +
      ' not the last one',
    fakeAsync(() => {
      spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(1);
      spyOn(playerTranscriptService, 'isLastCard').and.returnValue(false);
      spyOn(component, 'resetLocalHintsArray');

      component.ngOnInit();
      playerPositionService.onActiveCardChanged.emit();
      tick();

      expect(component.currentlyOnLatestCard).toBe(false);
      expect(component.resetLocalHintsArray).toHaveBeenCalledTimes(1);
      component.ngOnDestroy();
    })
  );

  it('should fire change detection when hint is used', fakeAsync(() => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );

    component.ngOnInit();
    hintsAndSolutionManagerService.onHintConsumed.emit();
    tick();

    expect(detectChangesSpy).toHaveBeenCalled();
    component.ngOnDestroy();
  }));

  it('should fire change detection when solution is viewed', fakeAsync(() => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );

    component.ngOnInit();
    hintsAndSolutionManagerService.onSolutionViewedEventEmitter.emit();
    tick();

    expect(detectChangesSpy).toHaveBeenCalled();
    component.ngOnDestroy();
  }));

  it(
    "should show hint button if hint is viewable and displayed card's" +
      ' interaction supports hints',
    () => {
      spyOn(hintsAndSolutionManagerService, 'isHintViewable').and.returnValues(
        false,
        true,
        true
      );

      expect(component.isHintButtonVisible(0)).toBe(false);

      // StateCard with EndExploration interaction, which does not supports hints.
      component.displayedCard = StateCard.createNewCard(
        'State 1',
        '<p>Content</p>',
        '<interaction></interaction>',
        Interaction.createFromBackendDict({
          id: 'EndExploration',
          answer_groups: [],
          default_outcome: null,
          confirmed_unclassified_answers: [],
          customization_args: {},
          hints: [],
          solution: null,
        }),
        RecordedVoiceovers.createEmpty(),
        'content'
      );

      expect(component.isHintButtonVisible(0)).toBe(false);

      // StateCard which supports hints.
      component.displayedCard = newCard;

      expect(component.isHintButtonVisible(0)).toBe(true);
    }
  );

  it('should show concept card button if concept card is viewable', () => {
    spyOn(conceptCardManagerService, 'isConceptCardViewable').and.returnValue(
      true
    );

    expect(component.isConceptCardButtonVisible()).toBe(true);
  });

  it('should not show concept card button if concept card is not viewable', () => {
    spyOn(conceptCardManagerService, 'isConceptCardViewable').and.returnValue(
      false
    );

    expect(component.isConceptCardButtonVisible()).toBe(false);
  });

  it('should show concept card when showConceptCard is called', () => {
    const mockState = {
      linkedSkillId: 'skill123',
    };
    spyOn(explorationEngineService, 'getState').and.returnValue(mockState);
    spyOn(conceptCardManagerService, 'openConceptCardModal');

    component.showConceptCard();

    expect(conceptCardManagerService.openConceptCardModal).toHaveBeenCalledWith(
      'skill123'
    );
  });

  it('should not open concept card modal when linkedSkillId is null', () => {
    const mockState = {
      linkedSkillId: null,
    };
    spyOn(explorationEngineService, 'getState').and.returnValue(mockState);
    spyOn(conceptCardManagerService, 'openConceptCardModal');

    component.showConceptCard();

    expect(
      conceptCardManagerService.openConceptCardModal
    ).not.toHaveBeenCalled();
  });

  it('should return concept card consumed status', () => {
    spyOn(conceptCardManagerService, 'isConceptCardConsumed').and.returnValues(
      true,
      false
    );

    expect(component.isConceptCardConsumed()).toBe(true);
    expect(component.isConceptCardConsumed()).toBe(false);
  });

  it('should show solution button if solution is released', () => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionViewable').and.returnValue(
      true
    );

    expect(component.isSolutionButtonVisible()).toBe(true);
  });

  it('should not show solution button if solution is not released', () => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionViewable').and.returnValue(
      false
    );

    expect(component.isSolutionButtonVisible()).toBe(false);
  });

  it('should display hint modal when user clicks on hints icon', fakeAsync(() => {
    spyOn(hintAndSolutionModalService, 'displayNewHintModal').and.returnValue({
      result: Promise.resolve('success'),
    } as NgbModalRef);

    expect(component.activeHintIndex).toBe(undefined);
    component.displayHintModal(0);

    expect(component.activeHintIndex).toBe(0);
  }));

  it(
    'should close display hint modal and reset active hint index when modal' +
      ' is closed',
    fakeAsync(() => {
      spyOn(hintAndSolutionModalService, 'displayNewHintModal').and.returnValue(
        {
          result: Promise.reject('failure'),
        } as NgbModalRef
      );

      expect(component.activeHintIndex).toBe(undefined);

      component.displayHintModal(0);
      tick();

      expect(component.activeHintIndex).toBe(null);
    })
  );

  it('should handle hint modal without result property', () => {
    const mockModalRef = {};
    spyOn(hintAndSolutionModalService, 'displayNewHintModal').and.returnValue(
      mockModalRef
    );

    component.displayHintModal(0);

    expect(component.activeHintIndex).toBe(0);
  });

  it(
    'should display solution modal if solution is' + ' already consumed',
    fakeAsync(() => {
      spyOn(
        hintsAndSolutionManagerService,
        'isSolutionConsumed'
      ).and.returnValue(true);
      spyOn(explorationModeService, 'isInQuestionMode').and.returnValue(false);
      spyOn(statsReportingService, 'recordSolutionHit');
      spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
        'state1'
      );
      spyOn(
        hintAndSolutionModalService,
        'displayNewSolutionModal'
      ).and.returnValue({
        result: Promise.resolve('success'),
      } as NgbModalRef);

      expect(component.solutionModalIsActive).toBe(false);

      component.onClickSolutionButton();
      tick();

      expect(component.solutionModalIsActive).toBe(true);
    })
  );

  it('should not record solution hit in editor preview mode', fakeAsync(() => {
    component._editorPreviewMode = true;
    spyOn(hintsAndSolutionManagerService, 'isSolutionConsumed').and.returnValue(
      true
    );
    spyOn(explorationModeService, 'isInQuestionMode').and.returnValue(false);
    spyOn(statsReportingService, 'recordSolutionHit');
    spyOn(
      hintAndSolutionModalService,
      'displayNewSolutionModal'
    ).and.returnValue({
      result: Promise.resolve('success'),
    } as NgbModalRef);

    component.onClickSolutionButton();
    tick();

    expect(statsReportingService.recordSolutionHit).not.toHaveBeenCalled();
  }));

  it('should not record solution hit in question mode', fakeAsync(() => {
    component._editorPreviewMode = false;
    spyOn(hintsAndSolutionManagerService, 'isSolutionConsumed').and.returnValue(
      true
    );
    spyOn(explorationModeService, 'isInQuestionMode').and.returnValue(true);
    spyOn(statsReportingService, 'recordSolutionHit');
    spyOn(
      hintAndSolutionModalService,
      'displayNewSolutionModal'
    ).and.returnValue({
      result: Promise.resolve('success'),
    } as NgbModalRef);

    component.onClickSolutionButton();
    tick();

    expect(statsReportingService.recordSolutionHit).not.toHaveBeenCalled();
  }));

  it('should close solution modal', fakeAsync(() => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionConsumed').and.returnValue(
      true
    );
    spyOn(explorationModeService, 'isInQuestionMode').and.returnValue(false);
    spyOn(statsReportingService, 'recordSolutionHit');
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'state1'
    );
    spyOn(
      hintAndSolutionModalService,
      'displayNewSolutionModal'
    ).and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);

    component.onClickSolutionButton();
    tick();

    expect(component.solutionModalIsActive).toBe(false);
  }));

  it(
    'should open interstitial modal if solution has not' +
      ' been consumed before and then display solution modal' +
      ' after user confirms',
    fakeAsync(() => {
      spyOn(
        hintsAndSolutionManagerService,
        'isSolutionConsumed'
      ).and.returnValue(false);
      spyOn(
        hintAndSolutionModalService,
        'displayNewSolutionInterstitialModal'
      ).and.returnValue({
        result: Promise.resolve('success'),
      } as NgbModalRef);
      spyOn(component, 'displaySolutionModal').and.callFake(() => {});

      component.onClickSolutionButton();
      tick();

      expect(component.displaySolutionModal).toHaveBeenCalled();
    })
  );

  it(
    'should close interstitial modal if solution has not' +
      ' been consumed before and user click cancel',
    fakeAsync(() => {
      spyOn(
        hintsAndSolutionManagerService,
        'isSolutionConsumed'
      ).and.returnValue(false);
      spyOn(
        hintAndSolutionModalService,
        'displayNewSolutionInterstitialModal'
      ).and.returnValue({
        result: Promise.reject('failure'),
      } as NgbModalRef);
      spyOn(component, 'displaySolutionModal').and.callFake(() => {});

      component.solutionModalIsActive = true;
      component.onClickSolutionButton();
      tick();

      expect(component.solutionModalIsActive).toBe(false);
      expect(component.displaySolutionModal).not.toHaveBeenCalled();
    })
  );

  it('should handle interstitial modal with afterDismissed method and confirm result', fakeAsync(() => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionConsumed').and.returnValue(
      false
    );
    const mockAfterDismissed = jasmine.createSpy().and.returnValue({
      subscribe: (callback: (result: string) => void) => {
        setTimeout(() => callback('confirm'), 0);
      },
    });
    const mockModalRef = {
      afterDismissed: mockAfterDismissed,
    };
    spyOn(
      hintAndSolutionModalService,
      'displayNewSolutionInterstitialModal'
    ).and.returnValue(mockModalRef);
    spyOn(component, 'displaySolutionModal');

    component.onClickSolutionButton();
    tick();

    expect(component.displaySolutionModal).toHaveBeenCalled();
  }));

  it('should handle interstitial modal with afterDismissed method and cancel result', fakeAsync(() => {
    spyOn(hintsAndSolutionManagerService, 'isSolutionConsumed').and.returnValue(
      false
    );
    const mockAfterDismissed = jasmine.createSpy().and.returnValue({
      subscribe: (callback: (result: string) => void) => {
        setTimeout(() => callback('cancel'), 0);
      },
    });
    const mockModalRef = {
      afterDismissed: mockAfterDismissed,
    };
    spyOn(
      hintAndSolutionModalService,
      'displayNewSolutionInterstitialModal'
    ).and.returnValue(mockModalRef);
    spyOn(component, 'displaySolutionModal');

    component.solutionModalIsActive = true;
    component.onClickSolutionButton();
    tick();

    expect(component.solutionModalIsActive).toBe(false);
    expect(component.displaySolutionModal).not.toHaveBeenCalled();
  }));

  it('should show if hint is consumed or not', () => {
    spyOn(hintsAndSolutionManagerService, 'isHintConsumed').and.returnValues(
      true,
      false
    );

    expect(component.isHintConsumed(0)).toBe(true);
    expect(component.isHintConsumed(0)).toBe(false);
  });

  it('should show solution is consumed or not', () => {
    spyOn(
      hintsAndSolutionManagerService,
      'isSolutionConsumed'
    ).and.returnValues(true, false);

    expect(component.isSolutionConsumed()).toBe(true);
    expect(component.isSolutionConsumed()).toBe(false);
  });
});
