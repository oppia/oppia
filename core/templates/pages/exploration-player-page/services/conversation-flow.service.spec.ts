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
 * @fileoverview Unit tests for conversation flow service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed, waitForAsync} from '@angular/core/testing';

import {ConversationFlowService} from './conversation-flow.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {ContentTranslationLanguageService} from './content-translation-language.service';
import {ContentTranslationManagerService} from './content-translation-manager.service';
import {ExplorationPlayerStateService} from './exploration-player-state.service';
import {PlayerPositionService} from './player-position.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
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
  let conversationFlowService: ConversationFlowService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let playerPositionService: PlayerPositionService;
  let playerTranscriptService: PlayerTranscriptService;

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
        ConversationFlowService,
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
    conversationFlowService = TestBed.inject(ConversationFlowService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService
    );
    playerPositionService = TestBed.inject(PlayerPositionService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
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

    conversationFlowService.addNewCardAndDisplayTranslations(displayedCard);
    expect(playerTranscriptService.addNewCard).toHaveBeenCalled();
    expect(
      contentTranslationManagerService.displayTranslations
    ).toHaveBeenCalled();
  });

  it('should tell if supplemental card is non empty', () => {
    expect(
      conversationFlowService.isSupplementalCardNonempty(displayedCard)
    ).toBeFalse();
  });
});
