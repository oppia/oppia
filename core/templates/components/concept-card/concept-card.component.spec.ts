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
 * @fileoverview Unit test for Concept Card Component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {ConceptCardBackendApiService} from 'domain/skill/concept-card-backend-api.service';
import {ConceptCard} from 'domain/skill/concept-card.model';
import {ConceptCardComponent} from './concept-card.component';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {ContentTranslationLanguageService} from 'pages/exploration-player-page/services/content-translation-language.service';

describe('Concept card component', () => {
  let fixture: ComponentFixture<ConceptCardComponent>;
  let componentInstance: ConceptCardComponent;
  let conceptCardBackendApiService: ConceptCardBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let conceptCard = new ConceptCard(
    new SubtitledHtml('', '1'),
    RecordedVoiceovers.createEmpty()
  );
  let conceptCardObjects = [conceptCard];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ConceptCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConceptCardComponent);
    componentInstance = fixture.componentInstance;
    conceptCardBackendApiService = TestBed.inject(ConceptCardBackendApiService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    contentTranslationLanguageService = TestBed.inject(
      ContentTranslationLanguageService
    );
  });

  it('should initialize and load concept cards successfully', fakeAsync(() => {
    spyOn(
      conceptCardBackendApiService,
      'loadConceptCardsAsync'
    ).and.returnValue(Promise.resolve(conceptCardObjects));
    componentInstance.index = 0;

    componentInstance.ngOnInit();
    tick();

    expect(componentInstance.loadingMessage).toEqual('');
    expect(componentInstance.currentConceptCard).toEqual(conceptCard);
  }));

  it('should emit the skill description once the concept card loads', fakeAsync(() => {
    const translatedConceptCard = new ConceptCard(
      new SubtitledHtml('', '1'),
      RecordedVoiceovers.createEmpty(),
      'nombre de la habilidad'
    );
    spyOn(
      conceptCardBackendApiService,
      'loadConceptCardsAsync'
    ).and.returnValue(Promise.resolve([translatedConceptCard]));
    const emitSpy = spyOn(componentInstance.skillDescriptionLoaded, 'emit');
    componentInstance.index = 0;

    componentInstance.ngOnInit();
    tick();

    expect(emitSpy).toHaveBeenCalledWith('nombre de la habilidad');
  }));

  it("should load concept cards in the learner's selected language", fakeAsync(() => {
    spyOn(
      i18nLanguageCodeService,
      'getCurrentI18nLanguageCode'
    ).and.returnValue('es');
    const loadConceptCardsSpy = spyOn(
      conceptCardBackendApiService,
      'loadConceptCardsAsync'
    ).and.returnValue(Promise.resolve(conceptCardObjects));
    componentInstance.index = 0;
    componentInstance.skillIds = ['skill_1'];

    componentInstance.ngOnInit();
    tick();

    expect(loadConceptCardsSpy).toHaveBeenCalledWith(['skill_1'], 'es');
  }));

  it('should initialize and handle error if fails to load concept cards', fakeAsync(() => {
    spyOn(
      conceptCardBackendApiService,
      'loadConceptCardsAsync'
    ).and.returnValue(Promise.reject({}));

    componentInstance.ngOnInit();
    tick();

    expect(componentInstance.loadingMessage).toEqual('');
    expect(componentInstance.skillDeletedMessage).toEqual(
      'Oops, it looks like this skill has been deleted.'
    );
  }));

  it("should prioritize the lesson's study language over the site language", fakeAsync(() => {
    spyOn(
      i18nLanguageCodeService,
      'getCurrentI18nLanguageCode'
    ).and.returnValue('es');
    spyOn(
      contentTranslationLanguageService,
      'getCurrentContentLanguageCode'
    ).and.returnValue('hi');
    const loadConceptCardsSpy = spyOn(
      conceptCardBackendApiService,
      'loadConceptCardsAsync'
    ).and.returnValue(Promise.resolve(conceptCardObjects));
    componentInstance.index = 0;
    componentInstance.skillIds = ['skill_1'];

    componentInstance.ngOnInit();
    tick();

    expect(loadConceptCardsSpy).toHaveBeenCalledWith(['skill_1'], 'hi');
  }));
});
