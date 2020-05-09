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
 * @fileoverview Unit tests for
 * MarkAllAudioAndTranslationsAsNeedingUpdateController.
 */

describe('Mark All Audio And Translations As Needing Update Controller',
  function() {
    var $scope, $uibModalInstance;

    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.inject(
      function($controller, $rootScope) {
        $scope = $rootScope.$new();
        $uibModalInstance = jasmine.createSpyObj(
          '$uibModalInstance', ['close', 'dismiss']);

        $controller(
          'MarkAllAudioAndTranslationsAsNeedingUpdateController', {
            $scope: $scope,
            $uibModalInstance: $uibModalInstance
          });
      }));

    it('should flag all audios and translations as needing update',
      function() {
        $scope.flagAll();
        expect($uibModalInstance.close).toHaveBeenCalled();
      });

    it('should cancel all audios and translations as needing update',
      function() {
        $scope.cancel();
        expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
      });
  });
