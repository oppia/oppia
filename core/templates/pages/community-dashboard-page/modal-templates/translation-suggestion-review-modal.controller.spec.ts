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
 * @fileoverview Unit tests for TranslationSuggestionReviewModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Translation Suggestion Review Modal Controller', function() {
  let $scope = null;
  let $uibModalInstance = null;
  let SuggestionModalService = null;

  const contentHtml = 'Content html';
  const reviewable = true;
  const translationHtml = 'Translation html';

  beforeEach(angular.mock.module('oppia', function($provide) {
    const ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $controller) {
    const $rootScope = $injector.get('$rootScope');
    SuggestionModalService = $injector.get('SuggestionModalService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    spyOnAllFunctions(SuggestionModalService);

    $scope = $rootScope.$new();
    $controller('TranslationSuggestionReviewModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      contentHtml: contentHtml,
      reviewable: reviewable,
      translationHtml: translationHtml
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.contentHtml).toBe(contentHtml);
      expect($scope.contentHtml).toBe(contentHtml);
      expect($scope.reviewable).toBe(reviewable);
      expect($scope.commitMessage).toBe('');
      expect($scope.reviewMessage).toBe('');
    });

  it('should accept suggestion in suggestion modal service when clicking on' +
    ' accept suggestion button', function() {
    $scope.reviewMessage = 'Review message example';
    $scope.commitMessage = 'Commit message example';
    $scope.accept();

    expect(SuggestionModalService.acceptSuggestion).toHaveBeenCalledWith(
      $uibModalInstance, {
        action: 'accept',
        commitMessage: 'Commit message example',
        reviewMessage: 'Review message example',
      });
  });

  it('should reject suggestion in suggestion modal service when clicking on' +
    ' reject suggestion button', function() {
    $scope.reviewMessage = 'Review message example';
    $scope.reject();

    expect(SuggestionModalService.rejectSuggestion).toHaveBeenCalledWith(
      $uibModalInstance, {
        action: 'reject',
        reviewMessage: 'Review message example'
      });
  });

  it('should cancel suggestion in suggestion modal service when clicking on' +
  ' cancel suggestion button', function() {
    $scope.cancel();

    expect(SuggestionModalService.cancelSuggestion).toHaveBeenCalledWith(
      $uibModalInstance);
  });
});
