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

require('services/NewService.ts');

describe('New service', function() {
  var NewService, $q, $rootScope,
    SkillObjectFactory, SkillUpdateService,
    SkillRightsObjectFactory;
  var fakeEditableSkillBackendApiService = null;

  var FakeEditableSkillBackendApiService = function() {
    var self = {
      newBackendQuestionObject: null,
      failure: null,
      fetchQuestions: null
    };

    var _fetchQuestions = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendQuestionObject);
        } else {
          reject();
        }
      });
    };

    self.newBackendQuestionObject = {};
    self.failure = null;
    self.fetchQuestions = _fetchQuestions;

    return self;
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    fakeEditableSkillBackendApiService = (
      FakeEditableSkillBackendApiService());
    $provide.value(
      'EditableSkillBackendApiService',
      [fakeEditableSkillBackendApiService][0]);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    NewService = $injector.get(
      'NewService');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
    SkillRightsObjectFactory = $injector.get('SkillRightsObjectFactory');
    SkillUpdateService = $injector.get('SkillUpdateService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    var misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };

    var misconceptionDict2 = {
      id: '4',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };


    var skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [
        {
          html: 'worked example 1',
          content_id: 'worked_example_1'
        },
        {
          html: 'worked example 2',
          content_id: 'worked_example_2'
        }
      ],
      content_ids_to_audio_translations: {
        explanation: {},
        worked_example_1: {},
        worked_example_2: {}
      }
    };

    var skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3
    };

    fakeEditableSkillBackendApiService.newBackendSkillObject = skillDict;
  }));

  beforeEach(angular.mock.inject(function(ContextService) {
    spyOn(
      ContextService, 'isInSkillEditorPage'
    ).and.returnValue(true);
  }));

  it('should request to fetch questions from the backend',
    function() {
      spyOn(fakeEditableSkillBackendApiService, 'fetchQuestions')
        .and.callThrough();

      NewService.fetchQuestionSummaries('1', false);
      expect(fakeEditableSkillBackendApiService.fetchQuestions)
        .toHaveBeenCalled();
  });
});
