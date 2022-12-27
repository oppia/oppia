// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the CkEditor copy toolbar component.
 */

import { async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from
  '@angular/platform-browser-dynamic/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EventEmitter } from '@angular/core';

import { ContentLanguageSelectorComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/layout-directives/content-language-selector.component';
import { ContentTranslationLanguageService } from
  'pages/exploration-player-page/services/content-translation-language.service';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PlayerTranscriptService } from
  'pages/exploration-player-page/services/player-transcript.service';
import { StateCard } from 'domain/state_card/state-card.model';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { SwitchContentLanguageRefreshRequiredModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/switch-content-language-refresh-required-modal.component';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { AudioTranslationLanguageService} from
  'pages/exploration-player-page/services/audio-translation-language.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { LoadingDotsComponent } from 'components/common-layout-directives/common-elements/loading-dots.component';
import { ContentTranslationManagerService } from '../services/content-translation-manager.service';

class MockContentTranslationLanguageService {
  currentLanguageCode!: string;

  getCurrentContentLanguageCode() {
    return this.currentLanguageCode;
  }

  getLanguageOptionsForDropdown() {
    return [
      {value: 'fr', displayed: 'français (French)'},
      {value: 'zh', displayed: '中文 (Chinese)'},
      {value: 'en', displayed: 'English'}
    ];
  }

  setCurrentContentLanguageCode(languageCode: string) {
    this.currentLanguageCode = languageCode;
  }
}

class MockI18nLanguageCodeService {
  getCurrentI18nLanguageCode() {
    return 'fr';
  }
}

describe('Content language selector component', () => {
  let component: ContentLanguageSelectorComponent;
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let contentTranslationManagerService: ContentTranslationManagerService;
  let fixture: ComponentFixture<ContentLanguageSelectorComponent>;
  let playerTranscriptService: PlayerTranscriptService;
  let imagePreloaderService: ImagePreloaderService;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let interactionObjectFactory: InteractionObjectFactory;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        NgbModule
      ],
      declarations: [
        ContentLanguageSelectorComponent,
        MockTranslatePipe,
        SwitchContentLanguageRefreshRequiredModalComponent
      ],
      providers: [{
        provide: ContentTranslationLanguageService,
        useClass: MockContentTranslationLanguageService
      }, {
        provide: I18nLanguageCodeService,
        useClass: MockI18nLanguageCodeService
      }]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          SwitchContentLanguageRefreshRequiredModalComponent
        ],
      }
    }).compileComponents();
    contentTranslationLanguageService = TestBed.get(
      ContentTranslationLanguageService);
    contentTranslationManagerService = TestBed.get(
      ContentTranslationManagerService);
    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    playerTranscriptService = TestBed.get(PlayerTranscriptService);
    imagePreloaderService = TestBed.get(ImagePreloaderService);
    audioTranslationLanguageService = TestBed.get(
      AudioTranslationLanguageService);
    fixture = TestBed.createComponent(ContentLanguageSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should correctly initialize selectedLanguageCode and ' +
     'languagesInExploration', () => {
    expect(component.selectedLanguageCode).toBe('fr');
    expect(component.languageOptions).toEqual([
      {value: 'fr', displayed: 'français (French)'},
      {value: 'zh', displayed: '中文 (Chinese)'},
      {value: 'en', displayed: 'English'}
    ]);
  });

  it('should correctly select an option when refresh is not needed',
    fakeAsync(() => {
      let mockOnStateCardContentUpdate = new EventEmitter<void>();
      spyOnProperty(
        contentTranslationManagerService, 'onStateCardContentUpdate'
      ).and.returnValue(mockOnStateCardContentUpdate);
      component.ngOnInit();
      const setCurrentContentLanguageCodeSpy = spyOn(
        contentTranslationLanguageService,
        'setCurrentContentLanguageCode');

      const card = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict({
          id: 'GraphInput',
          answer_groups: [
            {
              outcome: {
                dest: 'State',
                dest_if_really_stuck: null,
                feedback: {
                  html: '',
                  content_id: 'This is a new feedback text',
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
            dest_if_really_stuck: null,
            feedback: {
              content_id: '',
              html: '',
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
            },
          }
        }),
        RecordedVoiceovers.createEmpty(),
        'content', audioTranslationLanguageService);
      spyOn(playerTranscriptService, 'getCard').and.returnValue(card);
      spyOn(imagePreloaderService, 'restartImagePreloader');

      component.onSelectLanguage('fr');

      expect(setCurrentContentLanguageCodeSpy).toHaveBeenCalledWith('fr');
      expect(component.selectedLanguageCode).toBe('fr');
      expect(imagePreloaderService.restartImagePreloader).toHaveBeenCalled();

      mockOnStateCardContentUpdate.emit();
      tick();
      discardPeriodicTasks();
    }));

  it('should correctly open the refresh required modal when refresh is ' +
     'needed', () => {
    const setCurrentContentLanguageCodeSpy = spyOn(
      contentTranslationLanguageService,
      'setCurrentContentLanguageCode');

    const card = StateCard.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict({
        id: 'GraphInput',
        answer_groups: [
          {
            outcome: {
              dest: 'State',
              dest_if_really_stuck: null,
              feedback: {
                html: '',
                content_id: 'This is a new feedback text',
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
          dest_if_really_stuck: null,
          feedback: {
            content_id: '',
            html: '',
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
          },
        }
      }),
      RecordedVoiceovers.createEmpty(),
      'content', audioTranslationLanguageService);
    card.addInputResponsePair({
      learnerInput: '',
      oppiaResponse: '',
      isHint: false
    });
    spyOn(playerTranscriptService, 'getCard').and.returnValue(card);
    spyOn(imagePreloaderService, 'restartImagePreloader');

    component.onSelectLanguage('fr');
    expect(setCurrentContentLanguageCodeSpy).not.toHaveBeenCalled();
    expect(imagePreloaderService.restartImagePreloader).toHaveBeenCalled();
  });
});
