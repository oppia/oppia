// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ConceptCardBackendApiService.
 */

import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';

import { ConceptCardBackendApiService } from
  'domain/skill/concept-card-backend-api.service';
import { ConceptCard, ConceptCardBackendDict} from
  'domain/skill/concept-card.model';

describe('Concept card backend API service', () => {
  let conceptCardBackendApiService: ConceptCardBackendApiService;
  let httpTestingController: HttpTestingController;
  let sampleResponse1: Record<string, ConceptCardBackendDict[]>;
  let sampleResponse2: Record<string, ConceptCardBackendDict[]>;
  let sampleResponse3: Record<string, ConceptCardBackendDict[]>;
  let conceptCardSampleResponse1: ConceptCard[];
  let conceptCardSampleResponse2: ConceptCard[];
  let conceptCardSampleResponse3: ConceptCard[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConceptCardBackendApiService]
    });

    conceptCardBackendApiService = TestBed.inject(ConceptCardBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);

    var example1 = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1'
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1'
      }
    };
    var example2 = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1'
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1'
      }
    };
    var example3 = {
      question: {
        html: 'worked example question 3',
        content_id: 'worked_example_q_3'
      },
      explanation: {
        html: 'worked example explanation 3',
        content_id: 'worked_example_e_3'
      }
    };
    var example4 = {
      question: {
        html: 'worked example question 4',
        content_id: 'worked_example_q_4'
      },
      explanation: {
        html: 'worked example explanation 4',
        content_id: 'worked_example_e_4'
      }
    };
    var conceptCardDict1 = {
      explanation: {
        html: 'test explanation 1',
        content_id: 'explanation_1'
      },
      worked_examples: [example1, example2],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_q_1: {},
          worked_example_e_1: {},
          worked_example_q_2: {},
          worked_example_e_2: {}
        }
      }
    };

    var conceptCardDict2 = {
      explanation: {
        html: 'test explanation 2',
        content_id: 'explanation_2'
      },
      worked_examples: [example3, example4],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_q_3: {},
          worked_example_e_3: {},
          worked_example_q_4: {},
          worked_example_e_4: {}
        }
      }
    };

    sampleResponse1 = {
      concept_card_dicts: [conceptCardDict1]
    };

    sampleResponse2 = {
      concept_card_dicts: [conceptCardDict2]
    };

    sampleResponse3 = {
      concept_card_dicts: [conceptCardDict1, conceptCardDict2]
    };

    conceptCardSampleResponse1 = [];
    sampleResponse1.concept_card_dicts.forEach((conceptCardDict) => {
      conceptCardSampleResponse1.push(
        ConceptCard.createFromBackendDict(conceptCardDict));
    });

    conceptCardSampleResponse2 = [];
    sampleResponse2.concept_card_dicts.forEach((conceptCardDict) => {
      conceptCardSampleResponse2.push(
        ConceptCard.createFromBackendDict(conceptCardDict));
    });

    conceptCardSampleResponse3 = [];
    sampleResponse3.concept_card_dicts.forEach((conceptCardDict) => {
      conceptCardSampleResponse3.push(
        ConceptCard.createFromBackendDict(conceptCardDict));
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch a concept card from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      conceptCardBackendApiService.loadConceptCardsAsync(['1']).then(
        successHandler, failHandler);
      var req = httpTestingController.expectOne(
        '/concept_card_handler/' + encodeURIComponent('["1"]'));
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResponse1);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        conceptCardSampleResponse1);
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should succesfully fetch multiple concept cards from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let conceptCardDataUrl = (
        '/concept_card_handler/' + encodeURIComponent('["1","2"]'));

      conceptCardBackendApiService.loadConceptCardsAsync(['1', '2']).then(
        successHandler, failHandler);
      var req = httpTestingController.expectOne(conceptCardDataUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResponse3);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        conceptCardSampleResponse3);
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should get all concept cards even the one which was fetched before',
    fakeAsync(() => {
      conceptCardBackendApiService.loadConceptCardsAsync(['1']).then(
        (conceptCards) => {
          conceptCardBackendApiService.loadConceptCardsAsync(['1', '2']).then(
            (conceptCards2) => {
              expect(conceptCards).toEqual(conceptCardSampleResponse1);
              expect(conceptCards2).toEqual(conceptCardSampleResponse3);
            });

          var req1 = httpTestingController.expectOne(
            '/concept_card_handler/' + encodeURIComponent('["2"]'));
          expect(req1.request.method).toEqual('GET');
          req1.flush(sampleResponse2);
        });

      var req2 = httpTestingController.expectOne(
        '/concept_card_handler/' + encodeURIComponent('["1"]'));
      expect(req2.request.method).toEqual('GET');
      req2.flush(sampleResponse1);

      flushMicrotasks();
    }));

  it('should use the rejection handler if backend request failed',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      conceptCardBackendApiService.loadConceptCardsAsync(['1']).then(
        successHandler, failHandler);
      var req = httpTestingController.expectOne(
        '/concept_card_handler/' + encodeURIComponent('["1"]'));
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Error loading skill 1.'
      }, {
        status: 500, statusText: 'Error loading skill 1.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading skill 1.');
    }));

  it('should not fetch the same concept card', fakeAsync(() => {
    conceptCardBackendApiService.loadConceptCardsAsync(['1'])
      .then((conceptCards) => {
        conceptCardBackendApiService.loadConceptCardsAsync(['1'])
          .then((conceptCards2) => {
            expect(conceptCards).toEqual(conceptCards2);
            expect(conceptCards2).toEqual(conceptCardSampleResponse1);
          });
      });

    var req = httpTestingController.expectOne(
      '/concept_card_handler/' + encodeURIComponent('["1"]'));
    expect(req.request.method).toEqual('GET');
    req.flush(sampleResponse1);

    flushMicrotasks();
  }));
});
