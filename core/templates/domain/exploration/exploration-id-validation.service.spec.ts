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
 * @fileoverview Unit Tests for ExplorationIdValidationService
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
require('domain/exploration/exploration-id-validation.service.ts');

describe('Exploration id validation service', function() {
  var ExplorationIdValidationService = null;
  var invalidExpResults = null;
  var validExpResults = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    ExplorationIdValidationService = $injector.get(
      'ExplorationIdValidationService');
    $httpBackend = $injector.get('$httpBackend');

    validExpResults = {
      summaries: [{
        id: '0',
        num_views: 0,
        human_readable_contributors_summary: {},
        created_on_msec: 1581965806278.269,
        ratings: {
          5: 0,
          4: 0,
          1: 0,
          3: 0,
          2: 0
        },
        last_updated_msec: 1581965806278.183,
        language_code: 'en',
        category: 'Test',
        objective: 'Dummy exploration for testing all interactions',
        activity_type: 'exploration',
        status: 'public',
        thumbnail_bg_color: '#a33f40',
        tags: [],
        thumbnail_icon_url: '/subjects/Lightbulb.svg',
        community_owned: true,
        title: 'Test of all interactions'
      }]
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should correctly validate the invalid exploration ids',
    function() {
      // The service should respond false when the summaries array
      // is empty.
      $httpBackend.expectGET(/.*?explorationsummarieshandler?.*/g).respond({
        summaries: []
      });
      ExplorationIdValidationService.isExpPublished('0').then(
        function(response) {
          expect(response).toEqual(false);
        });
      $httpBackend.flush();

      // The service should respond false when the summaries array
      // contains null.
      $httpBackend.expectGET(/.*?explorationsummarieshandler?.*/g).respond({
        summaries: [null]
      });
      ExplorationIdValidationService.isExpPublished('0').then(
        function(response) {
          expect(response).toEqual(false);
        });
      $httpBackend.flush();

      // The service should respond false when the summaries array
      // contains more than one element.
      $httpBackend.expectGET(/.*?explorationsummarieshandler?.*/g).respond({
        summaries: [
          'exp_1',
          'exp_2'
        ]
      });
      ExplorationIdValidationService.isExpPublished('0').then(
        function(response) {
          expect(response).toEqual(false);
        });
      $httpBackend.flush();
    }
  );

  it('should correctly validate the valid exploration id',
    function() {
      $httpBackend.expectGET(/.*?explorationsummarieshandler?.*/g).respond(
        validExpResults);
      ExplorationIdValidationService.isExpPublished('0').then(
        function(response) {
          expect(response).toEqual(true);
        });
      $httpBackend.flush();
    }
  );
});
