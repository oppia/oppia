// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for tag misconception modal controller.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// question-misconception-editor.component.ts is upgraded to Angular 8.
import { MisconceptionObjectFactory } from
  'domain/skill/MisconceptionObjectFactory';
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { StateEditorService } from
  /* eslint-disable-next-line max-len */
  'components/state-editor/state-editor-properties-services/state-editor.service';
// ^^^ This block is to be removed.

require('directives/angular-html-bind.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');

describe('Tag misconception modal controller', function() {
  var $controller = null;
  var $uibModalInstance = null;
  var $rootScope = null;
  var $scope = null;
  var misconceptionObjectFactory = null;
  var mockMisconceptionObject = null;
  var ses = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'MisconceptionObjectFactory', new MisconceptionObjectFactory());
    $provide.value(
      'StateEditorService', new StateEditorService(
        new SolutionValidityService()));
  }));

  beforeEach(angular.mock.inject(
    function(_$controller_, _$q_, _$rootScope_, $injector) {
      $rootScope = _$rootScope_;
      misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');
      ses = $injector.get('StateEditorService');
      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);
      $scope = $rootScope.$new();
      $controller = _$controller_;
      mockMisconceptionObject = {
        abc: [
          misconceptionObjectFactory.create(
            '1', 'misc1', 'notes1', 'feedback1', true)
        ]
      };
      spyOn(ses, 'getMisconceptionsBySkill').and.callFake(function() {
        return mockMisconceptionObject;
      });
      $controller('TagMisconceptionModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        StateEditorService: ses,
        taggedSkillMisconceptionId: 'skillId',
      });
    }));

  it('should close modal correctly', function() {
    $scope.tempSelectedMisconception = mockMisconceptionObject.abc[0];
    $scope.tempSelectedMisconceptionSkillId = 'abc';
    $scope.done();
    expect($uibModalInstance.close).toHaveBeenCalledWith({
      misconception: mockMisconceptionObject.abc[0],
      misconceptionSkillId: 'abc',
      feedbackIsUsed: true
    });
  });

  it('should dismiss modal correctly', function() {
    $scope.cancel();
    expect($uibModalInstance.dismiss).toHaveBeenCalled();
  });
});
