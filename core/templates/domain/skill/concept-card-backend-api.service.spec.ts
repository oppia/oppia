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

require('domain/skill/concept-card-backend-api.service.ts');
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Concept card backend API service', function() {
  var ConceptCardBackendApiService = null;
  var $httpBackend = null;
  var sampleResponse1 = null;
  var sampleResponse2 = null;
  var sampleResponse3 = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    ConceptCardBackendApiService = $injector.get(
      'ConceptCardBackendApiService');
    $httpBackend = $injector.get('$httpBackend');

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
  }));


  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch a concept card from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/concept_card_handler/1').respond(
        sampleResponse1);
      ConceptCardBackendApiService.loadConceptCards(['1']).then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleResponse1.concept_card_dicts);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should succesfully fetch multiple concept cards from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var conceptCardDataUrl =
        '/concept_card_handler/' + encodeURIComponent('1,2');
      $httpBackend.expect('GET', conceptCardDataUrl).respond(
        sampleResponse3);
      ConceptCardBackendApiService.loadConceptCards(['1', '2']).then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleResponse3.concept_card_dicts);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should get all concept cards even the one which was fetched before',
    function() {
      $httpBackend.expect('GET', '/concept_card_handler/' + '1').respond(
        sampleResponse1);

      ConceptCardBackendApiService.loadConceptCards(['1']).then(
        function(conceptCards) {
          $httpBackend.expect('GET', '/concept_card_handler/' + '2').respond(
            sampleResponse2);
          ConceptCardBackendApiService.loadConceptCards(['1', '2']).then(
            function(conceptCards2) {
              expect(conceptCards).toEqual(sampleResponse1.concept_card_dicts);
              expect(conceptCards2).toEqual(sampleResponse3.concept_card_dicts);
            });
        });
      $httpBackend.flush();
    });

  it('should use the rejection handler if backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/concept_card_handler/1').respond(
        500, 'Error loading skill 1.');
      ConceptCardBackendApiService.loadConceptCards(['1']).then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading skill 1.');
    });

  it('should not fetch the same concept card', function() {
    $httpBackend.expect('GET', '/concept_card_handler/1').respond(
      sampleResponse1);
    ConceptCardBackendApiService.loadConceptCards(['1'])
      .then(function(conceptCards) {
        ConceptCardBackendApiService.loadConceptCards(['1'])
          .then(function(conceptCards2) {
            expect(conceptCards).toEqual(conceptCards2);
            expect(conceptCards2).toEqual(sampleResponse1.concept_card_dicts);
          });
      });
    $httpBackend.flush();
  });
});
