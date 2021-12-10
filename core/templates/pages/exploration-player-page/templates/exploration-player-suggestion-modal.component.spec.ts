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
 * @fileoverview Unit tests for ExplorationPlayerSuggestionModalComponent.
 */

import { ComponentFixture, TestBed, tick, waitForAsync, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { ExplorationPlayerSuggestionModalComponent } from './exploration-player-suggestion-modal.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RecordedVoiceovers } from
  'domain/exploration/recorded-voiceovers.model';
import { StateCard } from 'domain/state_card/state-card.model';
import { InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { AudioTranslationLanguageService } from
  'pages/exploration-player-page/services/audio-translation-language.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


describe('Exploration Player Suggestion Modal Controller', function() {
  let component: ExplorationPlayerSuggestionModalComponent;
  let fixture: ComponentFixture<ExplorationPlayerSuggestionModalComponent>;
  let interactionObjectFactory: InteractionObjectFactory;
  let writtenTranslationsObjectFactory: WrittenTranslationsObjectFactory;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let explorationEngineService: ExplorationEngineService;
  let playerTranscriptService: PlayerTranscriptService;
  let card: StateCard;
  let ngbActiveModal: NgbActiveModal;


  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      declarations: [ExplorationPlayerSuggestionModalComponent],
      providers: [
        InteractionObjectFactory,
        WrittenTranslationsObjectFactory,
        AudioTranslationLanguageService,
        ExplorationEngineService,
        PlayerTranscriptService,
        NgbActiveModal,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(function() {
    fixture = TestBed.createComponent(
      ExplorationPlayerSuggestionModalComponent);
    component = fixture.componentInstance;
    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    writtenTranslationsObjectFactory = TestBed.inject(
      WrittenTranslationsObjectFactory);
    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    let interaction = interactionObjectFactory.createFromBackendDict({
      id: null,
      answer_groups: [],
      default_outcome: null,
      confirmed_unclassified_answers: [],
      customization_args: {},
      hints: [],
      solution: null,
    });
    let recordedVoiceovers = RecordedVoiceovers.createEmpty();
    let writtenTranslations = writtenTranslationsObjectFactory.createEmpty();

    card = StateCard.createNewCard(
      'Card 1', 'Content html', 'Interaction text', interaction,
      recordedVoiceovers, writtenTranslations, 'content_id',
      audioTranslationLanguageService);

    spyOn(playerTranscriptService, 'getCard').and.returnValue(card);
  });

  it('should initialize component properties after component is initialized',
    function() {
      component.ngOnInit();
      expect(component.originalHtml).toBe('Content html');
      expect(component.description).toBe('');
      component.updateValue('Content html');
      expect(component.suggestionData).toEqual({
        suggestionHtml: 'Content html'
      });
      expect(component.showEditor).toBe(false);
    });

  it('should show editor when flushing timeout task', fakeAsync(() => {
    expect(component.showEditor).toBe(false);
    component.ngOnInit();
    flushMicrotasks();
    tick(501);
    expect(component.showEditor).toBe(true);
  }));

  it('should cancel suggestion in suggestion modal when clicking cancel' +
    ' suggestion button', function() {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancelSuggestion();
    expect(dismissSpy).toHaveBeenCalledWith('cancel');
  });

  it('should submit a suggestion when closing the modal', function() {
    spyOn(explorationEngineService, 'getExplorationId').and.returnValue('exp1');
    spyOn(explorationEngineService, 'getExplorationVersion').and.returnValue(1);
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    component.ngOnInit();
    component.submitSuggestion();

    expect(closeSpy).toHaveBeenCalledWith({
      target_id: 'exp1',
      version: 1,
      stateName: 'Card 1',
      suggestion_type: 'edit_exploration_state_content',
      target_type: 'exploration',
      description: '',
      suggestionHtml: 'Content html',
    });
  });
});
