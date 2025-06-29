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

import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {CardAnimationService} from './card-animation.service';
import {FocusManagerService} from '../../../services/stateful/focus-manager.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {PlayerPositionService} from './player-position.service';
import {WindowDimensionsService} from '../../../services/contextual/window-dimensions.service';
import {MessengerService} from '../../../services/messenger.service';
import {WindowRef} from '../../../services/contextual/window-ref.service';
import {ServicesConstants} from '../../../services/services.constants';
import {ExplorationPlayerConstants} from '../current-lesson-player/exploration-player-page.constants';

interface Card {
  content: string;
}

describe('CardAnimationService', () => {
  let service: CardAnimationService;
  let focusManagerService: jasmine.SpyObj<FocusManagerService>;
  let playerTranscriptService: jasmine.SpyObj<PlayerTranscriptService>;
  let playerPositionService: jasmine.SpyObj<PlayerPositionService>;
  let windowDimensionsService: jasmine.SpyObj<WindowDimensionsService>;
  let messengerService: jasmine.SpyObj<MessengerService>;
  let windowRef: jasmine.SpyObj<WindowRef>;

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
        {provide: WindowRef, useValue: {nativeWindow: {}}},
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
    windowDimensionsService = TestBed.inject(
      WindowDimensionsService
    ) as jasmine.SpyObj<WindowDimensionsService>;
    messengerService = TestBed.inject(
      MessengerService
    ) as jasmine.SpyObj<MessengerService>;
    windowRef = TestBed.inject(WindowRef) as jasmine.SpyObj<WindowRef>;
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

  it('should set displayed card index directly when window cannot show two cards', () => {
    const totalCards = 3;
    const lastCard: Card = {content: ''};
    const secondLastCard: Card = {content: ''};

    playerTranscriptService.getNumCards.and.returnValue(totalCards);
    playerTranscriptService.getLastCard.and.returnValue(lastCard);
    playerTranscriptService.getCard.and.returnValue(secondLastCard);

    windowDimensionsService.getWidth.and.returnValue(300);

    const isSupplementalCardNonempty = (card: Card): boolean =>
      card.content !== '';

    service.updateCardLayout(isSupplementalCardNonempty);

    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(
      totalCards - 1
    );
  });

  it('should call smoothScrollTo indirectly via scrollToBottom when tutor card is out of view', fakeAsync(() => {
    const mockTutorCard: HTMLElement = {
      getBoundingClientRect: () => ({
        top: 100,
        height: 100,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    } as HTMLElement;

    spyOn(document, 'querySelector').and.returnValue(mockTutorCard);
    spyOnProperty(window, 'scrollY', 'get').and.returnValue(50);
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(120);

    const scrollToSpy = spyOn(window, 'scrollTo').and.callThrough();

    service.scrollToBottom();
    tick(150);

    expect(scrollToSpy).toHaveBeenCalled();
  }));

  it('should not call window.scrollTo via scrollToBottom if tutor card fully visible', fakeAsync(() => {
    const mockTutorCard: HTMLElement = {
      getBoundingClientRect: () => ({
        top: 100,
        height: 100,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    } as HTMLElement;

    spyOn(document, 'querySelector').and.returnValue(mockTutorCard);
    spyOnProperty(window, 'scrollY', 'get').and.returnValue(200);
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(200);

    const scrollToSpy = spyOn(window, 'scrollTo').and.callThrough();

    service.scrollToBottom();
    tick(150);

    expect(scrollToSpy).not.toHaveBeenCalled();
  }));

  it('should not scrollToBottom if tutor card is not present', fakeAsync(() => {
    spyOn(document, 'querySelector').and.returnValue(null);
    spyOnProperty(window, 'scrollY', 'get').and.returnValue(200);
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(200);

    const scrollToSpy = spyOn(window, 'scrollTo').and.callThrough();

    service.scrollToBottom();
    tick(150);

    expect(scrollToSpy).not.toHaveBeenCalled();
  }));

  it('should schedule next card transition, call callback and focus after delay', fakeAsync(() => {
    const callback = jasmine.createSpy('callback');
    service.scheduleNextCardTransition('nextFocus', callback);

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
      'nextFocus'
    );
  }));

  it('should update card layout and animate to two cards if conditions are met', () => {
    playerTranscriptService.getNumCards.and.returnValue(3);
    const lastCard: Card = {content: 'last'};
    const secondLastCard: Card = {content: 'secondLast'};
    playerTranscriptService.getLastCard.and.returnValue(lastCard);
    playerTranscriptService.getCard.and.returnValue(secondLastCard);
    windowDimensionsService.getWidth.and.returnValue(1200);

    const isSupplementalCardNonempty = (card: Card): boolean =>
      card.content === 'last';

    service.updateCardLayout(isSupplementalCardNonempty);

    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(2);
    expect(service.getIsAnimatingToTwoCards()).toBeTrue();
  });

  it('should update card layout and animate to one card if conditions are met', fakeAsync(() => {
    playerTranscriptService.getNumCards.and.returnValue(3);
    const lastCard: Card = {content: ''};
    const secondLastCard: Card = {content: 'secondLast'};
    playerTranscriptService.getLastCard.and.returnValue(lastCard);
    playerTranscriptService.getCard.and.returnValue(secondLastCard);
    windowDimensionsService.getWidth.and.returnValue(1200);

    const isSupplementalCardNonempty = (card: Card): boolean =>
      card.content !== '';

    service.updateCardLayout(isSupplementalCardNonempty);

    expect(service.getIsAnimatingToOneCard()).toBeTrue();

    tick(ExplorationPlayerConstants.TIME_NUM_CARDS_CHANGE_MSEC);

    expect(service.getIsAnimatingToOneCard()).toBeFalse();
  }));

  it('should adjust iframe height and send message on significant height change', fakeAsync(() => {
    Object.defineProperty(document, 'body', {
      get: () => ({scrollHeight: 1000}),
      configurable: true,
    });

    service.adjustPageHeight(true, () => {});
    tick(100);

    expect(messengerService.sendMessage).toHaveBeenCalledWith(
      ServicesConstants.MESSENGER_PAYLOAD.HEIGHT_CHANGE,
      jasmine.objectContaining({height: 1050, scroll: true})
    );
  }));

  it('should call callback after height adjustment', fakeAsync(() => {
    let called = false;
    Object.defineProperty(document, 'body', {
      get: () => ({scrollHeight: 900}),
      configurable: true,
    });

    service.adjustPageHeight(false, () => {
      called = true;
    });
    tick(100);

    expect(called).toBeTrue();
  }));

  it('should register window resize callback to adjust page height', () => {
    const adjustSpy = spyOn(service, 'adjustPageHeight');
    service.adjustPageHeightOnresize();

    (windowRef.nativeWindow as Window).onresize?.(new UIEvent('resize'));
    expect(adjustSpy).toHaveBeenCalledWith(false, null);
  });
});
