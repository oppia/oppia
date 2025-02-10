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
 * @fileoverview Unit tests for progress nav component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {StateCard} from 'domain/state_card/state-card.model';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {ExplorationEngineService} from '../services/exploration-engine.service';
import {ExplorationPlayerStateService} from '../services/exploration-player-state.service';
import {
  HelpCardEventResponse,
  PlayerPositionService,
} from '../services/player-position.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {ProgressNavComponent} from './progress-nav.component';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SchemaFormSubmittedService} from 'services/schema-form-submitted.service';
import {ContentTranslationManagerService} from '../services/content-translation-manager.service';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {AudioTranslationLanguageService} from '../services/audio-translation-language.service';

describe('Progress nav component', () => {
  let fixture: ComponentFixture<ProgressNavComponent>;
  let componentInstance: ProgressNavComponent;

  let urlService: UrlService;
  let playerPositionService: PlayerPositionService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let focusManagerService: FocusManagerService;
  let playerTranscriptService: PlayerTranscriptService;
  let windowDimensionsService: WindowDimensionsService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let schemaFormSubmittedService: SchemaFormSubmittedService;
  let contentTranslationManagerService: ContentTranslationManagerService;
  let mockDisplayedCard = new StateCard(
    '',
    '',
    '',
    {} as Interaction,
    [],
    {} as RecordedVoiceovers,
    '',
    {} as AudioTranslationLanguageService
  );
  let mockDisplayedCard2 = new StateCard(
    'state',
    'name',
    'html',
    {} as Interaction,
    [],
    {} as RecordedVoiceovers,
    '',
    {} as AudioTranslationLanguageService
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ProgressNavComponent, MockTranslatePipe],
      providers: [
        ExplorationEngineService,
        ExplorationPlayerStateService,
        FocusManagerService,
        PlayerPositionService,
        PlayerTranscriptService,
        UrlService,
        WindowDimensionsService,
        SchemaFormSubmittedService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressNavComponent);
    componentInstance = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService
    );
    focusManagerService = TestBed.inject(FocusManagerService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    schemaFormSubmittedService = TestBed.inject(SchemaFormSubmittedService);
    contentTranslationManagerService = TestBed.inject(
      ContentTranslationManagerService
    );

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should initialize', fakeAsync(() => {
    let isIframed = true;
    let mockOnHelpCardAvailableEventEmitter =
      new EventEmitter<HelpCardEventResponse>();
    let mockSchemaFormSubmittedEventEmitter = new EventEmitter<void>();

    spyOn(urlService, 'isIframed').and.returnValue(isIframed);
    spyOn(componentInstance.submit, 'emit');
    spyOnProperty(playerPositionService, 'onHelpCardAvailable').and.returnValue(
      mockOnHelpCardAvailableEventEmitter
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOnProperty(
      schemaFormSubmittedService,
      'onSubmittedSchemaBasedForm'
    ).and.returnValue(mockSchemaFormSubmittedEventEmitter);

    componentInstance.ngOnInit();
    mockOnHelpCardAvailableEventEmitter.emit({
      hasContinueButton: true,
    } as HelpCardEventResponse);
    mockSchemaFormSubmittedEventEmitter.emit();
    tick();

    expect(componentInstance.isIframed).toEqual(isIframed);
    expect(componentInstance.helpCardHasContinueButton).toBeTrue();
    expect(componentInstance.submit.emit).toHaveBeenCalled();
  }));

  it('should update displayed card info', fakeAsync(() => {
    let transcriptLength = 10;
    let displayedCardIndex = 0;

    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(
      transcriptLength
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(
      displayedCardIndex
    );
    spyOn(playerTranscriptService, 'isLastCard').and.returnValue(true);
    spyOn(explorationPlayerStateService, 'isInQuestionMode').and.returnValue(
      true
    );
    spyOn(focusManagerService, 'setFocusWithoutScroll');

    componentInstance.displayedCard = mockDisplayedCard;
    spyOn(mockDisplayedCard, 'getInteractionId').and.returnValue('Continue');

    componentInstance.updateDisplayedCardInfo();
    tick();

    expect(playerTranscriptService.getNumCards).toHaveBeenCalled();
    expect(playerPositionService.getDisplayedCardIndex).toHaveBeenCalled();
    expect(playerTranscriptService.isLastCard).toHaveBeenCalled();
    expect(componentInstance.helpCardHasContinueButton).toBeFalse();
    expect(componentInstance.interactionIsInline).toEqual(
      mockDisplayedCard.isInteractionInline()
    );
    expect(componentInstance.interactionCustomizationArgs).toEqual(
      mockDisplayedCard.getInteractionCustomizationArgs()
    );
  }));

  it('should respond to state card content updates', fakeAsync(() => {
    let mockOnStateCardContentUpdate = new EventEmitter<void>();
    spyOn(componentInstance, 'updateDisplayedCardInfo');
    spyOnProperty(
      contentTranslationManagerService,
      'onStateCardContentUpdate'
    ).and.returnValue(mockOnStateCardContentUpdate);

    componentInstance.ngOnInit();
    tick();
    expect(componentInstance.updateDisplayedCardInfo).not.toHaveBeenCalled();

    mockOnStateCardContentUpdate.emit();
    tick();

    expect(componentInstance.updateDisplayedCardInfo).toHaveBeenCalled();
  }));

  it('should tell if window can show two cards', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX + 1
    );

    expect(componentInstance.canWindowShowTwoCards()).toBeTrue();
  });

  it('should tell if generic submit button should be shown', () => {
    spyOn(
      componentInstance,
      'doesInteractionHaveNavSubmitButton'
    ).and.returnValues(false, true);
    spyOn(componentInstance, 'canWindowShowTwoCards').and.returnValue(false);

    expect(componentInstance.shouldGenericSubmitButtonBeShown()).toBeFalse();

    expect(componentInstance.shouldGenericSubmitButtonBeShown()).toBeTrue();
  });

  it('should tell if continue button should be shown', () => {
    componentInstance.conceptCardIsBeingShown = true;

    expect(componentInstance.shouldContinueButtonBeShown()).toBeTrue();

    componentInstance.conceptCardIsBeingShown = false;
    componentInstance.interactionIsInline = false;

    expect(componentInstance.shouldContinueButtonBeShown()).toBeFalse();
  });

  it('should change card', () => {
    componentInstance.transcriptLength = 5;
    spyOn(componentInstance.changeCard, 'emit');

    componentInstance.validateIndexAndChangeCard(0);

    expect(componentInstance.changeCard.emit).toHaveBeenCalled();

    expect(() => {
      componentInstance.validateIndexAndChangeCard(-1);
    }).toThrowError('Target card index out of bounds.');
  });

  it('should be able to skip the question', () => {
    spyOn(componentInstance.skipQuestion, 'emit');

    componentInstance.skipCurrentQuestion();

    expect(componentInstance.skipQuestion.emit).toHaveBeenCalled();
  });

  it('should tell if interaction have submit nav button', () => {
    componentInstance.interactionId = 'ImageClickInput';

    expect(componentInstance.doesInteractionHaveNavSubmitButton()).toBeFalse();

    componentInstance.interactionId = 'not_valid';

    expect(() => {
      componentInstance.doesInteractionHaveNavSubmitButton();
    }).toThrowError();
  });

  it('should update displayed card info when view updates', () => {
    spyOn(componentInstance, 'updateDisplayedCardInfo');
    componentInstance.lastDisplayedCard = mockDisplayedCard2;
    componentInstance.displayedCard = mockDisplayedCard;

    componentInstance.ngOnChanges();

    expect(componentInstance.lastDisplayedCard).toEqual(mockDisplayedCard);
    expect(componentInstance.updateDisplayedCardInfo).toHaveBeenCalled();
  });
});
