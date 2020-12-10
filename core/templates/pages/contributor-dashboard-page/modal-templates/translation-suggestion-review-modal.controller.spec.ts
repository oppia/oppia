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

import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Translation Suggestion Review Modal Controller', function() {
  let $scope = null;
  let $uibModalInstance = null;
  let SiteAnalyticsService = null;
  let SuggestionModalService = null;

  const contentHtml = 'Content html';
  const reviewable = true;
  const translationHtml = 'Translation html';

  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $controller) {
    const $rootScope = $injector.get('$rootScope');
    SiteAnalyticsService = $injector.get('SiteAnalyticsService');
    SuggestionModalService = $injector.get('SuggestionModalService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    spyOn(
      SiteAnalyticsService,
      'registerContributorDashboardViewSuggestionForReview');
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

  it('should register Contributor Dashboard view suggestion for review event' +
    ' after controller is initialized', function() {
    expect(
      // eslint-disable-next-line max-len
      SiteAnalyticsService.registerContributorDashboardViewSuggestionForReview)
      .toHaveBeenCalledWith('Translation');
  });

  it('should accept suggestion in suggestion modal service when clicking on' +
    ' accept suggestion button', function() {
    spyOn(
      SiteAnalyticsService,
      'registerContributorDashboardAcceptSuggestion');
    $scope.reviewMessage = 'Review message example';
    $scope.commitMessage = 'Commit message example';

    $scope.accept();

    expect(
      SiteAnalyticsService.registerContributorDashboardAcceptSuggestion)
      .toHaveBeenCalledWith('Translation');
    expect(SuggestionModalService.acceptSuggestion).toHaveBeenCalledWith(
      $uibModalInstance, {
        action: 'accept',
        commitMessage: 'Commit message example',
        reviewMessage: 'Review message example',
      });
  });

  it('should reject suggestion in suggestion modal service when clicking on' +
    ' reject suggestion button', function() {
    spyOn(
      SiteAnalyticsService,
      'registerContributorDashboardRejectSuggestion');
    $scope.reviewMessage = 'Review message example';

    $scope.reject();

    expect(
      SiteAnalyticsService.registerContributorDashboardRejectSuggestion)
      .toHaveBeenCalledWith('Translation');
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
