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
import {StateCard} from '../../../domain/state_card/state-card.model';
import {ContentTranslationLanguageService} from './content-translation-language.service';
import {ContentTranslationManagerService} from './content-translation-manager.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from '../../../components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {Interaction} from '../../../domain/exploration/InteractionObjectFactory';
import {ExplorationModeService} from './exploration-mode.service';
import {ExplorationEngineService} from './exploration-engine.service';

describe('Conversation flow service', () => {
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let contentTranslationManagerService: ContentTranslationManagerService;
  let conversationFlowService: ConversationFlowService;
  let playerTranscriptService: PlayerTranscriptService;
  let explorationModeService: ExplorationModeService;
  let explorationEngineService: ExplorationEngineService;

  let createCard = function (interactionType: string): StateCard {
    return new StateCard(
      null,
      null,
      null,
      new Interaction([], [], null, null, [], interactionType, null),
      [],
      null,
      '',
      null
    );
  };
  let displayedCard = createCard('');

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConversationFlowService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
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
    explorationModeService = TestBed.inject(ExplorationModeService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    conversationFlowService = TestBed.inject(ConversationFlowService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
  }));

  it('should handle adding new cards to transcript', () => {
    spyOn(playerTranscriptService, 'addNewCard');
    spyOn(conversationFlowService, 'getLanguageCode').and.returnValue('en');
    spyOn(
      contentTranslationLanguageService,
      'getCurrentContentLanguageCode'
    ).and.returnValue('es');
    spyOn(
      contentTranslationManagerService,
      'displayTranslations'
    ).and.returnValue();

    conversationFlowService.addNewCard(displayedCard);
    expect(playerTranscriptService.addNewCard).toHaveBeenCalledWith(
      displayedCard
    );
    expect(
      contentTranslationManagerService.displayTranslations
    ).toHaveBeenCalledWith('es');
  });

  it('should tell if supplemental card is non empty', () => {
    expect(
      conversationFlowService.isSupplementalCardNonempty(displayedCard)
    ).toBeFalse();

    let textInputCard = createCard('TextInput');
    expect(
      conversationFlowService.isSupplementalCardNonempty(textInputCard)
    ).toBeFalse();

    let supplementaryImageInputCard = createCard('ImageClickInput');
    expect(
      conversationFlowService.isSupplementalCardNonempty(
        supplementaryImageInputCard
      )
    ).toBeTrue();
  });

  it('should record new card added', () => {
    spyOn(explorationEngineService, 'recordNewCardAdded');
    spyOn(conversationFlowService, 'recordNewCardAdded').and.callThrough();
    explorationModeService.setExplorationMode();
    conversationFlowService.recordNewCardAdded();
    expect(conversationFlowService.recordNewCardAdded).toHaveBeenCalled();
  });

  it('should test getters', () => {
    expect(conversationFlowService.onPlayerStateChange).toBeDefined();
    expect(conversationFlowService.onOppiaFeedbackAvailable).toBeDefined();
    expect(conversationFlowService.onShowProgressModal).toBeDefined();
  });

  it('should get language code', () => {
    let languageCode: string = 'test_lang_code';
    spyOn(explorationEngineService, 'getLanguageCode').and.returnValue(
      languageCode
    );
    explorationModeService.setExplorationMode();
    expect(conversationFlowService.getLanguageCode()).toEqual(languageCode);
  });
});
