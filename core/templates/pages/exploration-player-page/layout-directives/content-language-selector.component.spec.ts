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

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from
  '@angular/platform-browser-dynamic/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

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
import { WrittenTranslationsObjectFactory } from 'domain/exploration/WrittenTranslationsObjectFactory';
import { SwitchContentLanguageRefreshRequiredModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/switch-content-language-refresh-required-modal.component';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { AudioTranslationLanguageService} from
  'pages/exploration-player-page/services/audio-translation-language.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

class MockContentTranslationLanguageService {
  currentLanguageCode: string;

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
  let fixture: ComponentFixture<ContentLanguageSelectorComponent>;
  let playerTranscriptService: PlayerTranscriptService;
  let writtenTranslationsObjectFactory: WrittenTranslationsObjectFactory;
  let imagePreloaderService: ImagePreloaderService;
  let audioTranslationLanguageService: AudioTranslationLanguageService;

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
        entryComponents: [SwitchContentLanguageRefreshRequiredModalComponent],
      }
    }).compileComponents();
    contentTranslationLanguageService = TestBed.get(
      ContentTranslationLanguageService);
    playerTranscriptService = TestBed.get(PlayerTranscriptService);
    writtenTranslationsObjectFactory = TestBed.get(
      WrittenTranslationsObjectFactory);
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

  it('should correctly select an option when refresh is not needed', () => {
    const setCurrentContentLanguageCodeSpy = spyOn(
      contentTranslationLanguageService,
      'setCurrentContentLanguageCode');

    const card = StateCard.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      null,
      RecordedVoiceovers.createEmpty(),
      'content', audioTranslationLanguageService);
    spyOn(playerTranscriptService, 'getCard').and.returnValue(card);
    spyOn(imagePreloaderService, 'restartImagePreloader');

    component.onSelectLanguage('fr');

    expect(setCurrentContentLanguageCodeSpy).toHaveBeenCalledWith('fr');
    expect(component.selectedLanguageCode).toBe('fr');
    expect(imagePreloaderService.restartImagePreloader).toHaveBeenCalled();
  });

  it('should correctly open the refresh required modal when refresh is ' +
     'needed', () => {
    const setCurrentContentLanguageCodeSpy = spyOn(
      contentTranslationLanguageService,
      'setCurrentContentLanguageCode');

    const card = StateCard.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      null,
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
