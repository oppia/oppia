// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LearnerAnswerDetailsDataService.
 */

require('domain/editor/undo_redo/UndoRedoService.ts');
require('pages/exploration-editor-page/services/learner-answer-details-data.service.spec.ts');
require('services/CsrfTokenService.ts');

describe('Learner answer info backend Api service', function() {
  var LearnerAnswerDetailsDataService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $httpBackend = null;
  var CsrfService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector, $q) {
    LearnerAnswerDetailsDataService = $injector.get(
      'LearnerAnswerDetailsDataService');
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    sampleDataResults = {
        story_title: 'Story title',
        story_description: 'Story description',
        completed_nodes: [],
        pending_nodes: []
      };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing story from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/story_data_handler/0').respond(
        sampleDataResults);
      StoryViewerBackendApiService.fetchStoryData('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );
});
