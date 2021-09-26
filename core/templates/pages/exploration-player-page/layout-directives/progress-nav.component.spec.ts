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
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { ExplorationPlayerStateService } from '../services/exploration-player-state.service';
import { HelpCardEventResponse, PlayerPositionService } from '../services/player-position.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { ProgressNavComponent } from './progress-nav.component';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Progress nav component', () => {
  let fixture: ComponentFixture<ProgressNavComponent>;
  let componentInstance: ProgressNavComponent;

  let urlService: UrlService;
  let playerPositionService: PlayerPositionService;
  let browserCheckerService: BrowserCheckerService;
  let explorationPlayerStateService;
  let focusManagerService: FocusManagerService;
  let playerTranscriptService: PlayerTranscriptService;

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
    componentInstance.updateDisplayedCardInfo();
    tick(100);

    expect(playerTranscriptService.getNumCards).toHaveBeenCalled();
    expect(playerPositionService.getDisplayedCardIndex).toHaveBeenCalled();
    expect(playerTranscriptService.isLastCard).toHaveBeenCalled();
  }));

  it('should tell if interaction have special case for mobile', () => {
    spyOn(browserCheckerService, 'isMobileDevice')
      .and.returnValues(true, false);
    componentInstance.interactionId = '';
    expect(componentInstance.doesInteractionHaveSpecialCaseForMobile())
      .toBeFalse();
    expect(componentInstance.doesInteractionHaveSpecialCaseForMobile())
      .toBeFalse();
    expect(browserCheckerService.isMobileDevice).toHaveBeenCalled();
  });
});
