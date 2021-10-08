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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { StateCard } from 'domain/state_card/state-card.model';
import { BrowserCheckerService } from 'domain/utilities/browser-checker.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { ExplorationPlayerStateService } from '../services/exploration-player-state.service';
import { HelpCardEventResponse, PlayerPositionService } from '../services/player-position.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { ProgressNavComponent } from './progress-nav.component';

describe('Progress nav component', () => {
  let fixture: ComponentFixture<ProgressNavComponent>;
  let componentInstance: ProgressNavComponent;

  let urlService: UrlService;
  let playerPositionService: PlayerPositionService;
  let browserCheckerService: BrowserCheckerService;
  let explorationPlayerStateService;
  let focusManagerService: FocusManagerService;
  let playerTranscriptService: PlayerTranscriptService;
  let windowDimensionsService: WindowDimensionsService;
  let explorationEngineService: ExplorationEngineService;

  let mockDisplayedCard = new StateCard(
    '', '', '', null, [], null, null, '', null);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        ProgressNavComponent,
        MockTranslatePipe
      ],
      providers: [
        BrowserCheckerService,
        ExplorationEngineService,
        ExplorationPlayerStateService,
        FocusManagerService,
        PlayerPositionService,
        PlayerTranscriptService,
        UrlService,
        WindowDimensionsService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressNavComponent);
    componentInstance = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    browserCheckerService = TestBed.inject(BrowserCheckerService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService);
    focusManagerService = TestBed.inject(FocusManagerService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should initialize', fakeAsync(() => {
    let isIframed = true;
    let mockDisplayedCardIndexChangedEventEmitter = new EventEmitter<void>();
    let mockOnHelpCardAvailableEventEmitter = (
      new EventEmitter<HelpCardEventResponse>());

    spyOn(urlService, 'isIframed').and.returnValue(isIframed);
    spyOn(componentInstance, 'updateDisplayedCardInfo');
    spyOnProperty(
      playerPositionService, 'displayedCardIndexChangedEventEmitter')
      .and.returnValue(mockDisplayedCardIndexChangedEventEmitter);
    spyOnProperty(playerPositionService, 'onHelpCardAvailable')
      .and.returnValue(mockOnHelpCardAvailableEventEmitter);
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);

    componentInstance.ngOnInit();
    mockDisplayedCardIndexChangedEventEmitter.emit();
    mockOnHelpCardAvailableEventEmitter.emit({
      hasContinueButton: true
    } as HelpCardEventResponse);
    tick();

    expect(componentInstance.isIframed).toEqual(isIframed);
    expect(componentInstance.updateDisplayedCardInfo).toHaveBeenCalled();
    expect(componentInstance.helpCardHasContinueButton).toBeTrue();
  }));

  it('should update displayed card info', fakeAsync(() => {
    let transcriptLength = 10;
    let displayedCardIndex = 0;

    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(
      transcriptLength);
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(
      displayedCardIndex);
    spyOn(playerTranscriptService, 'isLastCard').and.returnValue(true);
    spyOn(explorationPlayerStateService, 'isInQuestionMode')
      .and.returnValue(true);
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
      mockDisplayedCard.isInteractionInline());
    expect(componentInstance.interactionCustomizationArgs).toEqual(
      mockDisplayedCard.getInteractionCustomizationArgs());
  }));

  it('should return true if interaction has special case for mobile', () => {
    spyOn(browserCheckerService, 'isMobileDevice')
      .and.returnValue(true);
    componentInstance.interactionId = 'ItemSelectionInput';
    expect(componentInstance.doesInteractionHaveSpecialCaseForMobile())
      .toBeTrue();
    expect(browserCheckerService.isMobileDevice).toHaveBeenCalled();
  });

  it('should return false if interaction id is not item selection input',
    () => {
      spyOn(browserCheckerService, 'isMobileDevice').and.returnValue(false);
      componentInstance.interactionId = 'not item selection input';

      expect(componentInstance.doesInteractionHaveSpecialCaseForMobile())
        .toBeFalse();
      expect(browserCheckerService.isMobileDevice).toHaveBeenCalled();
    });

  it('should not resolve special case for interaction if in desktop mode',
    () => {
      spyOn(browserCheckerService, 'isMobileDevice').and.returnValue(false);
      componentInstance.interactionCustomizationArgs = {
        maxAllowableSelectionCount: {
          value: 2
        }
      };
      componentInstance.interactionId = 'ItemSelectionInput';

      expect(componentInstance.doesInteractionHaveSpecialCaseForMobile())
        .toBeTrue();
      expect(browserCheckerService.isMobileDevice).toHaveBeenCalled();
    });

  it('should tell if window can show two cards', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX + 1);

    expect(componentInstance.canWindowShowTwoCards()).toBeTrue();
  });

  it('should tell if generic submit button should be shown', () => {
    spyOn(componentInstance, 'doesInteractionHaveSpecialCaseForMobile')
      .and.returnValues(true, false);
    spyOn(componentInstance, 'doesInteractionHaveNavSubmitButton')
      .and.returnValue(false);

    expect(componentInstance.shouldGenericSubmitButtonBeShown()).toBeTrue();
    expect(componentInstance.shouldGenericSubmitButtonBeShown()).toBeFalse();
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
    spyOn(playerPositionService, 'recordNavigationButtonClick');
    spyOn(playerPositionService, 'setDisplayedCardIndex');
    spyOn(explorationEngineService.onUpdateActiveStateIfInEditor, 'emit');
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue('');
    spyOn(playerPositionService, 'changeCurrentQuestion');

    componentInstance.changeCard(0);

    expect(playerPositionService.recordNavigationButtonClick)
      .toHaveBeenCalled();
    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalled();
    expect(explorationEngineService.onUpdateActiveStateIfInEditor.emit)
      .toHaveBeenCalled();
    expect(playerPositionService.getCurrentStateName).toHaveBeenCalled();
    expect(playerPositionService.changeCurrentQuestion).toHaveBeenCalled();

    expect(() => {
      componentInstance.changeCard(-1);
    }).toThrowError('Target card index out of bounds.');
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
    componentInstance.lastDisplayedCard = null;
    componentInstance.displayedCard = mockDisplayedCard;

    componentInstance.ngOnChanges();

    expect(componentInstance.lastDisplayedCard).toEqual(mockDisplayedCard);
    expect(componentInstance.updateDisplayedCardInfo).toHaveBeenCalled();
  });
});
