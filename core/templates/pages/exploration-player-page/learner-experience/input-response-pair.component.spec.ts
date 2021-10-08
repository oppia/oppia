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
 * @fileoverview Unit tests for LearnerAnswerInfoCard
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BackgroundMaskService } from 'services/stateful/background-mask.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { InputResponsePairComponent } from './input-response-pair.component';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { StateCard } from 'domain/state_card/state-card.model';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { WrittenTranslationsObjectFactory } from 'domain/exploration/WrittenTranslationsObjectFactory';
import { AudioTranslationLanguageService } from '../services/audio-translation-language.service';
import { AudioTranslationManagerService } from '../services/audio-translation-manager.service';
import { AppConstants } from 'app.constants';
import { AudioPlayerService } from 'services/audio-player.service';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';

describe('InputResponsePairComponent', () => {
  let component: InputResponsePairComponent;
  let fixture: ComponentFixture<InputResponsePairComponent>;
  let explorationHtmlFormatter: ExplorationHtmlFormatterService;
  let interactionObjectFactory: InteractionObjectFactory;
  let writtenTranslationsObjectFactory: WrittenTranslationsObjectFactory;
  let playerTranscriptService: PlayerTranscriptService;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let audioTranslationManagerService: AudioTranslationManagerService;
  let audioPlayerService: AudioPlayerService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [
        InputResponsePairComponent,
        MockTranslatePipe
      ],
      providers: [BackgroundMaskService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    writtenTranslationsObjectFactory = TestBed.get(
      WrittenTranslationsObjectFactory);
    explorationHtmlFormatter = TestBed.get(ExplorationHtmlFormatterService);
    audioPlayerService = TestBed.get(AudioPlayerService);
    playerTranscriptService = TestBed.get(PlayerTranscriptService);
    interactionObjectFactory = TestBed.get(InteractionObjectFactory);
    audioTranslationManagerService = TestBed.get(
      AudioTranslationManagerService);
    audioTranslationLanguageService = TestBed.get(
      AudioTranslationLanguageService);
    fixture = TestBed.createComponent(InputResponsePairComponent);
    component = fixture.componentInstance;

    spyOn(playerTranscriptService, 'getCard')
      .and.returnValue(StateCard.createNewCard(
        'State 2', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict({
          id: 'GraphInput',
          answer_groups: [
            {
              outcome: {
                dest: 'State',
                feedback: {
                  html: '',
                  content_id: 'This is a new feedback text',
                  image_sizes_in_bytes: {}
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
            feedback: {
              content_id: '',
              html: '',
              image_sizes_in_bytes: {}
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
          },
          hints: [],
          solution: {
            answer_is_exclusive: true,
            correct_answer: 'test_answer',
            explanation: {
              content_id: '2',
              html: 'test_explanation1',
              image_sizes_in_bytes: {}
            },
          }
        }),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService
      ));
  });

  it('should decode profile picture URI on initialization', () => {
    component.profilePicture = '%2Fprofile%2Fuser%2F1';

    expect(component.decodedProfilePicture).toBe(undefined);

    component.ngOnInit();

    expect(component.decodedProfilePicture).toBe('/profile/user/1');
  });

  it('should check if input response contains video rte element', () => {
    component.data = {
      learnerInput: '',
      oppiaResponse: 'oppia-noninteractive-video-response',
      isHint: true
    };

    expect(component.isVideoRteElementPresentInResponse()).toBe(true);
  });

  it('should get answer html for the displayed card', () => {
    spyOn(explorationHtmlFormatter, 'getAnswerHtml').and.returnValue(
      '<p> HTML Answer </p>'
    );
    component.data = {
      learnerInput: '',
      oppiaResponse: 'oppia-noninteractive-video-response',
      isHint: true
    };

    expect(component.getAnswerHtml()).toBe('<p> HTML Answer </p>');
  });

  it('should toggle popover when user clicks on it', () => {
    // This throws "Type '{ toggle: () => void; }' is missing the following
    // properties from type 'NgbPopover': _elementRef, _renderer, _ngZone,
    // _document, and 26 more.". We need to suppress this error because we have
    // to only test the toggle function.
    // @ts-expect-error
    component.popover = {
      toggle: () => {}
    };
    spyOn(component.popover, 'toggle');

    component.togglePopover();

    expect(component.popover.toggle).toHaveBeenCalled();
  });

  it('should get a short summary of the answer', () => {
    spyOn(explorationHtmlFormatter, 'getShortAnswerHtml')
      .and.returnValue('Short Answer');
    component.data = {
      // This throws "Type '{ answerDetails: string; }' is not assignable to
      // type 'string'.". We need to suppress this error because we need to
      // store "answerDetails" to test the relevant code.
      // @ts-expect-error
      learnerInput: {
        answerDetails: 'Answer Details'
      },
      oppiaResponse: 'oppia-noninteractive-video-response',
      isHint: true
    };

    expect(component.getShortAnswerHtml()).toBe('Answer Details');

    component.data = {
      learnerInput: '',
      oppiaResponse: 'oppia-noninteractive-video-response',
      isHint: true
    };

    expect(component.getShortAnswerHtml()).toBe('Short Answer');
  });

  it('should check if the current card is at the end of the transcript', () => {
    spyOn(playerTranscriptService, 'isLastCard').and.returnValue(true);

    expect(component.isCurrentCardAtEndOfTranscript()).toBe(true);
  });

  it('should get the css class for feedback audio highlight', () => {
    spyOn(audioTranslationManagerService, 'getCurrentComponentName')
      .and.returnValue(AppConstants.COMPONENT_NAME_FEEDBACK);
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);
    component.isLastPair = false;

    expect(component.getFeedbackAudioHighlightClass()).toBe('');

    component.isLastPair = true;

    expect(component.getFeedbackAudioHighlightClass()).toBe(
      ExplorationPlayerConstants.AUDIO_HIGHLIGHT_CSS_CLASS
    );
  });
});
