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
 * @fileoverview Unit tests for CardAnimationService.
 */

import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {CardAnimationService} from './card-animation.service';
import {FocusManagerService} from '../../../services/stateful/focus-manager.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {PlayerPositionService} from './player-position.service';
import {WindowDimensionsService} from '../../../services/contextual/window-dimensions.service';
import {MessengerService} from '../../../services/messenger.service';
import {WindowRef} from '../../../services/contextual/window-ref.service';
import {ExplorationPlayerConstants} from '../current-lesson-player/exploration-player-page.constants';

describe('CardAnimationService', () => {
  let service: CardAnimationService;
  let focusManagerService: jasmine.SpyObj<FocusManagerService>;
  let playerTranscriptService: jasmine.SpyObj<PlayerTranscriptService>;
  let playerPositionService: jasmine.SpyObj<PlayerPositionService>;
  let windowRef: WindowRef;
  let windowDimensionsService: jasmine.SpyObj<WindowDimensionsService>;
  let messengerService: jasmine.SpyObj<MessengerService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CardAnimationService,
        {
          provide: FocusManagerService,
          useValue: jasmine.createSpyObj('FocusManagerService', [
            'setFocusIfOnDesktop',
          ]),
        },
        {
          provide: PlayerTranscriptService,
          useValue: jasmine.createSpyObj('PlayerTranscriptService', [
            'getNumCards',
            'getLastCard',
            'getCard',
          ]),
        },
        {
          provide: PlayerPositionService,
          useValue: jasmine.createSpyObj('PlayerPositionService', [
            'setDisplayedCardIndex',
          ]),
        },
        {
          provide: WindowDimensionsService,
          useValue: jasmine.createSpyObj('WindowDimensionsService', [
            'getWidth',
          ]),
        },
        {
          provide: MessengerService,
          useValue: jasmine.createSpyObj('MessengerService', ['sendMessage']),
        },
        {
          provide: WindowRef,
          useValue: {
            nativeWindow: {} as Window,
          },
        },
      ],
    });

    service = TestBed.inject(CardAnimationService);
    focusManagerService = TestBed.inject(
      FocusManagerService
    ) as jasmine.SpyObj<FocusManagerService>;
    playerTranscriptService = TestBed.inject(
      PlayerTranscriptService
    ) as jasmine.SpyObj<PlayerTranscriptService>;
    playerPositionService = TestBed.inject(
      PlayerPositionService
    ) as jasmine.SpyObj<PlayerPositionService>;
    windowRef = TestBed.inject(WindowRef);
    windowDimensionsService = TestBed.inject(
      WindowDimensionsService
    ) as jasmine.SpyObj<WindowDimensionsService>;
    messengerService = TestBed.inject(
      MessengerService
    ) as jasmine.SpyObj<MessengerService>;
  });

  it('should animate to two cards and reset animation flag after timeout', fakeAsync(() => {
    service.animateToTwoCards();
    expect(service.getIsAnimatingToTwoCards()).toBeTrue();

    tick(
      ExplorationPlayerConstants.TIME_NUM_CARDS_CHANGE_MSEC +
        ExplorationPlayerConstants.TIME_FADEIN_MSEC +
        ExplorationPlayerConstants.TIME_PADDING_MSEC
    );

    expect(service.getIsAnimatingToTwoCards()).toBeFalse();
  }));

  it('should tell if window can show two cards', () => {
    windowDimensionsService.getWidth.and.returnValue(
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX + 1
    );

    expect(service.canWindowShowTwoCards()).toBeTrue();
  });

  it('should adjust page height on scroll', fakeAsync(() => {
    service.lastRequestedHeight = document.body.scrollHeight + 100;
    service.adjustPageHeight();
    tick(150);

    expect(messengerService.sendMessage).toHaveBeenCalled();
  }));

  it('should animate to one card and update displayed card index after timeout', fakeAsync(() => {
    playerTranscriptService.getNumCards.and.returnValue(3);

    service.animateToOneCard();
    expect(service.getIsAnimatingToOneCard()).toBeTrue();

    tick(ExplorationPlayerConstants.TIME_NUM_CARDS_CHANGE_MSEC);

    expect(service.getIsAnimatingToOneCard()).toBeFalse();
    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(2);
  }));

  it('should call setDisplayedCardIndex with last card index on animateToOneCard', fakeAsync(() => {
    playerTranscriptService.getNumCards.and.returnValue(5);
    service.animateToOneCard();

    tick(ExplorationPlayerConstants.TIME_NUM_CARDS_CHANGE_MSEC + 10);

    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(4);
  }));

  it('should call scrollTo if cardNavigationControl is partially out of view', fakeAsync(() => {
    const mockCardNavigationControl = document.createElement('div');
    mockCardNavigationControl.getBoundingClientRect = () => ({
      top: 100,
      height: 100,
      bottom: 200,
      left: 0,
      right: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    spyOn(document, 'querySelector').and.returnValue(mockCardNavigationControl);
    spyOnProperty(window, 'scrollY', 'get').and.returnValue(50);
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(120);

    const scrollSpy = spyOn(window, 'scrollTo');

    service.scrollToBottom();
    tick(150);

    expect(scrollSpy).toHaveBeenCalled();
  }));

  it('should not scroll if cardNavigationControl is already visible', fakeAsync(() => {
    const mockCardNavigationControl = document.createElement('div');
    mockCardNavigationControl.getBoundingClientRect = () => ({
      top: 100,
      height: 100,
      bottom: 200,
      left: 0,
      right: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    spyOn(document, 'querySelector').and.returnValue(mockCardNavigationControl);
    spyOnProperty(window, 'scrollY', 'get').and.returnValue(200);
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(200);

    const scrollSpy = spyOn(window, 'scrollTo');

    service.scrollToBottom();
    tick(150);

    expect(scrollSpy).not.toHaveBeenCalled();
  }));

  it('should not scroll if cardNavigationControl is missing', fakeAsync(() => {
    spyOn(document, 'querySelector').and.returnValue(null);
    const scrollSpy = spyOn(window, 'scrollTo');

    service.scrollToBottom();
    tick(150);

    expect(scrollSpy).not.toHaveBeenCalled();
  }));

  it('should call callback and focus after transition', fakeAsync(() => {
    const callback = jasmine.createSpy('callback');
    service.scheduleNextCardTransition('focusLabel', callback);

    tick(
      0.1 * ExplorationPlayerConstants.TIME_FADEOUT_MSEC +
        0.1 * ExplorationPlayerConstants.TIME_HEIGHT_CHANGE_MSEC
    );

    expect(callback).toHaveBeenCalled();

    tick(
      ExplorationPlayerConstants.TIME_HEIGHT_CHANGE_MSEC +
        0.5 * ExplorationPlayerConstants.TIME_FADEIN_MSEC
    );

    expect(focusManagerService.setFocusIfOnDesktop).toHaveBeenCalledWith(
      'focusLabel'
    );
  }));

  it('should register resize callback and adjust height on resize', () => {
    const adjustSpy = spyOn(service, 'adjustPageHeight');

    service.adjustPageHeightOnresize();

    (windowRef.nativeWindow as Window).onresize?.(new UIEvent('resize'));
    expect(adjustSpy).toHaveBeenCalledWith();
  });
});
