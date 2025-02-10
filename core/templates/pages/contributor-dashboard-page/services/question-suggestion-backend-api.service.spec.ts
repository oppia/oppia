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
 * @fileoverview Unit tests for QuestionSuggestionBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {AppConstants} from 'app.constants';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {Question} from 'domain/question/QuestionObjectFactory';
import {ConceptCard} from 'domain/skill/concept-card.model';
import {Skill} from 'domain/skill/SkillObjectFactory';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {QuestionSuggestionBackendApiService} from './question-suggestion-backend-api.service';

const fakeImage = (): File => {
  const blob = new Blob([''], {type: 'image/jpeg'});
  return blob as File;
};

describe('Question Suggestion Backend Api Service', () => {
  let qsbas: QuestionSuggestionBackendApiService;
  let httpTestingController: HttpTestingController;
  let imageLocalStorageService: ImageLocalStorageService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QuestionSuggestionBackendApiService],
    }).compileComponents();
  }));

  beforeEach(() => {
    qsbas = TestBed.inject(QuestionSuggestionBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
  });

  it('should suggest questions', fakeAsync(() => {
    spyOn(
      imageLocalStorageService,
      'getFilenameToBase64MappingAsync'
    ).and.returnValue(Promise.resolve({}));
    let question = {
      toBackendDict: (isNewQuestion: boolean) => {
        return {};
      },
    };

    const conceptCard = new ConceptCard(
      SubtitledHtml.createDefault(
        'review material',
        AppConstants.COMPONENT_NAME_EXPLANATION
      ),
      [],
      RecordedVoiceovers.createFromBackendDict({
        voiceovers_mapping: {
          COMPONENT_NAME_EXPLANATION: {},
        },
      })
    );

    let associatedSkill = new Skill(
      'test_skill',
      'description',
      [],
      [],
      conceptCard,
      'en',
      1,
      0,
      'test_id',
      false,
      []
    );

    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    qsbas
      .submitSuggestionAsync(question as Question, associatedSkill, 1, [
        {
          filename: 'image',
          imageBlob: fakeImage(),
        },
      ])
      .then(successHandler, failHandler);
    tick();

    let req = httpTestingController.expectOne('/suggestionhandler/');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
