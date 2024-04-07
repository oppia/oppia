// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for common conversation skin service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';

import {ConversationSkinService} from './conversation-skin.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {ContentTranslationLanguageService} from '../services/content-translation-language.service';
import {ContentTranslationManagerService} from '../services/content-translation-manager.service';
import {ExplorationPlayerStateService} from '../services/exploration-player-state.service';
import {PlayerPositionService} from '../services/player-position.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {WindowRef} from 'services/contextual/window-ref.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/path/name',
      reload: () => {},
    },
    onresize: () => {},
    addEventListener(event: string, callback) {
      callback({returnValue: null});
    },
    scrollTo: (x, y) => {},
  };
}

describe('Conversation skin service', () => {
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let contentTranslationManagerService: ContentTranslationManagerService;
  let conversationSkinService: ConversationSkinService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let playerPositionService: PlayerPositionService;
  let playerTranscriptService: PlayerTranscriptService;
  let windowDimensionsService: WindowDimensionsService;

  let displayedCard = new StateCard(
    null,
    null,
    null,
    new Interaction([], [], null, null, [], '', null),
    [],
    null,
    '',
    null
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConversationSkinService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    contentTranslationLanguageService = TestBed.inject(
      ContentTranslationLanguageService
    );
    contentTranslationManagerService = TestBed.inject(
      ContentTranslationManagerService
    );
    conversationSkinService = TestBed.inject(ConversationSkinService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService
    );
    playerPositionService = TestBed.inject(PlayerPositionService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
  }));

  it('should handle new card addition', () => {
    spyOn(playerTranscriptService, 'addNewCard');
    spyOn(explorationPlayerStateService, 'getLanguageCode').and.returnValue(
      'en'
    );
    spyOn(
      contentTranslationLanguageService,
      'getCurrentContentLanguageCode'
    ).and.returnValue('es');
    spyOn(
      contentTranslationManagerService,
      'displayTranslations'
    ).and.returnValue();
    spyOn(playerTranscriptService, 'getNumCards').and.returnValues(2, 1);
    spyOn(playerPositionService, 'setDisplayedCardIndex');
    spyOn(playerPositionService, 'changeCurrentQuestion');

    spyOn(
      conversationSkinService,
      'isSupplementalCardNonempty'
    ).and.returnValues(false, true);
    spyOn(conversationSkinService, 'canWindowShowTwoCards').and.returnValue(
      true
    );
    spyOn(conversationSkinService, 'animateToTwoCards');

    conversationSkinService.handleNewCardAddition(displayedCard);
    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(1);
    expect(conversationSkinService.animateToTwoCards).toHaveBeenCalled();

    conversationSkinService.handleNewCardAddition(displayedCard);
    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(1);

    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    conversationSkinService.handleNewCardAddition(displayedCard);
    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(0);
    expect(playerPositionService.changeCurrentQuestion).toHaveBeenCalledWith(0);
  });

  it('should tell if window can show two cards', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX + 1
    );

    expect(conversationSkinService.canWindowShowTwoCards()).toBeTrue();
  });

  it('should tell if supplemental card is non empty', () => {
    expect(
      conversationSkinService.isSupplementalCardNonempty(displayedCard)
    ).toBeFalse();
  });

  it('should animate to one card', fakeAsync(() => {
    let doneCallbackSpy = jasmine.createSpy('done callback');
    conversationSkinService.animateToOneCard(doneCallbackSpy);

    tick(600);
    expect(conversationSkinService.isPlayerAnimatingToOneCard()).toBeFalse();
    expect(doneCallbackSpy).toHaveBeenCalled();
  }));

  it('should animate to two cards', fakeAsync(() => {
    let doneCallbackSpy = jasmine.createSpy('done callback');
    conversationSkinService.animateToTwoCards(doneCallbackSpy);

    tick(1000);
    expect(conversationSkinService.isPlayerAnimatingToTwoCards()).toBeFalse();
    expect(doneCallbackSpy).toHaveBeenCalled();
  }));
});
