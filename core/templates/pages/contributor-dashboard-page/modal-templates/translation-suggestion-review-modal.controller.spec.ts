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
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Translation Suggestion Review Modal Controller', function() {
  let $scope = null;
  let $uibModalInstance = null;
  let SiteAnalyticsService = null;
  let contributionAndReviewService = null;
  let AlertsService = null;
  let userService = null;
  let languageUtilService = null;
  let userInfoSpy = null;
  let contributionRightsDataSpy = null;

  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $controller) {
    contributionAndReviewService = $injector.get(
      'ContributionAndReviewService');
    languageUtilService = $injector.get('LanguageUtilService');

    SiteAnalyticsService = $injector.get('SiteAnalyticsService');
    AlertsService = $injector.get('AlertsService');
    spyOn(
      SiteAnalyticsService,
      'registerContributorDashboardViewSuggestionForReview');
    spyOn(
      languageUtilService, 'getAudioLanguageDescription')
      .and.returnValue('audio_language_description');
  }));

  describe('when reviewing suggestion', function() {
    const reviewable = true;
    const subheading = 'subheading_title';
    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: 'Translation'
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: 'Translation CHANGED'
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: null
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2'
      }
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2
    };
    beforeEach(angular.mock.inject(function($injector, $controller, $q) {
      const $rootScope = $injector.get('$rootScope');
      userService = $injector.get('UserService');
      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      userInfoSpy = spyOn(userService, 'getUserInfoAsync')
        .and.returnValue($q.resolve({
          isLoggedIn: () => true,
          getUsername: () => 'admin-1'
        }));
      contributionRightsDataSpy = spyOn(
        userService, 'getUserContributionRightsDataAsync')
        .and.returnValue($q.resolve({
          can_review_translation_for_language_codes: () => 'hi',
          getUsername: () => 'admin-1'
        }));
      $scope = $rootScope.$new();
      $controller('TranslationSuggestionReviewModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        initialSuggestionId: 'suggestion_1',
        subheading: subheading,
        reviewable: reviewable,
        suggestionIdToContribution: angular.copy(suggestionIdToContribution),
        userService: userService
      });
      $rootScope.$apply();
      $scope.init();
    }));

    it('should call user service at initialization.',
      function() {
        $scope.$apply();
        expect(userInfoSpy).toHaveBeenCalled();
        expect(contributionRightsDataSpy).toHaveBeenCalled();
      });

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.activeSuggestionId).toBe('suggestion_1');
        expect($scope.activeSuggestion).toEqual(suggestion1);
        expect($scope.subheading).toBe('subheading_title');
        expect($scope.reviewable).toBe(reviewable);
        expect($scope.reviewMessage).toBe('');
      });

    it('should register Contributor Dashboard view suggestion for review ' +
      'event after controller is initialized', function() {
      expect(
        SiteAnalyticsService
          .registerContributorDashboardViewSuggestionForReview)
        .toHaveBeenCalledWith('Translation');
    });

    it('should notify user on failed suggestion update', function() {
      const error = {
        data: {
          error: 'Error'
        }
      };

      expect($scope.errorFound).toBeFalse();
      expect($scope.errorMessage).toBe('');

      $scope.showTranslationSuggestionUpdateError(error);

      expect($scope.errorFound).toBeTrue();
      expect($scope.errorMessage).toBe('Invalid Suggestion: Error');
    });

    it('should accept suggestion in suggestion modal service when clicking' +
      ' on accept and review next suggestion button', function() {
      expect($scope.activeSuggestionId).toBe('suggestion_1');
      expect($scope.activeSuggestion).toEqual(suggestion1);
      expect($scope.reviewable).toBe(reviewable);
      expect($scope.reviewMessage).toBe('');
      // Suggestion 1's exploration_content_html matches its content_html.
      expect($scope.hasExplorationContentChanged()).toBe(false);
      expect($scope.displayExplorationContent()).toEqual(
        suggestion1.change.content_html);

      spyOn(
        SiteAnalyticsService,
        'registerContributorDashboardAcceptSuggestion');
      spyOn(contributionAndReviewService, 'resolveSuggestionToExploration')
        .and.callFake((
            targetId, suggestionId, action, reviewMessage, commitMessage,
            successCallback, errorCallback) => {
          successCallback();
        });

      $scope.reviewMessage = 'Review message example';
      $scope.translationUpdated = true;
      $scope.acceptAndReviewNext();

      expect($scope.activeSuggestionId).toBe('suggestion_2');
      expect($scope.activeSuggestion).toEqual(suggestion2);
      expect($scope.reviewable).toBe(reviewable);
      expect($scope.reviewMessage).toBe('');
      // Suggestion 2's exploration_content_html does not match its
      // content_html.
      expect($scope.hasExplorationContentChanged()).toBe(true);
      expect($scope.displayExplorationContent()).toEqual(
        suggestion2.exploration_content_html);
      expect(
        SiteAnalyticsService.registerContributorDashboardAcceptSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '1', 'suggestion_1', 'accept', 'Review message example: ' +
          'This suggestion was submitted with reviewer edits.',
          'hint section of "StateName" card',
          $scope.showNextItemToReview,
          jasmine.any(Function));

      $scope.reviewMessage = 'Review message example 2';
      $scope.translationUpdated = false;
      $scope.acceptAndReviewNext();
      expect(
        SiteAnalyticsService.registerContributorDashboardAcceptSuggestion)
        .toHaveBeenCalledWith('Translation');

      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '2', 'suggestion_2', 'accept', 'Review message example 2',
          'hint section of "StateName" card', $scope.showNextItemToReview,
          jasmine.any(Function));
      expect($uibModalInstance.close).toHaveBeenCalledWith([
        'suggestion_1', 'suggestion_2']);
    });

    it(
      'should reject suggestion in suggestion modal service when clicking ' +
      'on reject and review next suggestion button', function() {
        expect($scope.activeSuggestionId).toBe('suggestion_1');
        expect($scope.activeSuggestion).toEqual(suggestion1);
        expect($scope.reviewable).toBe(reviewable);
        expect($scope.reviewMessage).toBe('');

        spyOn(contributionAndReviewService, 'resolveSuggestionToExploration')
          .and.callFake((
              targetId, suggestionId, action, reviewMessage, commitMessage,
              callback) => {
            callback();
          });
        spyOn(
          SiteAnalyticsService,
          'registerContributorDashboardRejectSuggestion');

        $scope.reviewMessage = 'Review message example';
        $scope.rejectAndReviewNext();

        expect($scope.activeSuggestionId).toBe('suggestion_2');
        expect($scope.activeSuggestion).toEqual(suggestion2);
        expect($scope.reviewable).toBe(reviewable);
        expect($scope.reviewMessage).toBe('');
        expect(
          SiteAnalyticsService.registerContributorDashboardRejectSuggestion)
          .toHaveBeenCalledWith('Translation');
        expect(contributionAndReviewService.resolveSuggestionToExploration)
          .toHaveBeenCalledWith(
            '1', 'suggestion_1', 'reject', 'Review message example',
            'hint section of "StateName" card', $scope.showNextItemToReview);

        $scope.reviewMessage = 'Review message example 2';
        $scope.rejectAndReviewNext();

        expect(
          SiteAnalyticsService.registerContributorDashboardRejectSuggestion)
          .toHaveBeenCalledWith('Translation');
        expect(contributionAndReviewService.resolveSuggestionToExploration)
          .toHaveBeenCalledWith(
            '2', 'suggestion_2', 'reject', 'Review message example 2',
            'hint section of "StateName" card', $scope.showNextItemToReview);
        expect($uibModalInstance.close).toHaveBeenCalledWith([
          'suggestion_1', 'suggestion_2']);
      });

    it('should reject a suggestion if the backend pre accept validation ' +
    'failed', function() {
      expect($scope.activeSuggestionId).toBe('suggestion_1');
      expect($scope.activeSuggestion).toEqual(suggestion1);
      expect($scope.reviewable).toBe(reviewable);
      expect($scope.reviewMessage).toBe('');
      spyOn(
        SiteAnalyticsService,
        'registerContributorDashboardAcceptSuggestion');
      spyOn(contributionAndReviewService, 'resolveSuggestionToExploration')
        .and.callFake((
            targetId, suggestionId, action, reviewMessage, commitMessage,
            successCallback, errorCallback) => {
          let dummyErrorResponse = {
            data: { error: 'Error!' }
          };
          if (errorCallback) {
            errorCallback(dummyErrorResponse);
          }
        });
      spyOn(AlertsService, 'addWarning');

      $scope.reviewMessage = 'Review message example';
      $scope.acceptAndReviewNext();

      expect(
        SiteAnalyticsService.registerContributorDashboardAcceptSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '1', 'suggestion_1', 'accept', 'Review message example',
          'hint section of "StateName" card', $scope.showNextItemToReview,
          jasmine.any(Function));
      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Invalid Suggestion: Error!');
    });

    it(
      'should cancel suggestion in suggestion modal service when clicking ' +
      'on cancel suggestion button', function() {
        $scope.cancel();
        expect($uibModalInstance.close).toHaveBeenCalledWith([]);
      });

    it(
      'should open the translation editor when the edit button is clicked',
      function() {
        $scope.editSuggestion();
        expect($scope.startedEditing).toBe(true);
      });

    it(
      'should close the translation editor when the cancel button is clicked',
      function() {
        $scope.cancelEdit();
        expect($scope.startedEditing).toBe(false);
      });

    it(
      'should update translation when the update button is clicked',
      function() {
        $scope.activeSuggestion.suggestion_id = 'suggestion_1';
        $scope.editedContent = {
          html: '<p>In Hindi</p>'
        };
        $scope.activeSuggestion.change = {
          cmd: 'add_written_translation',
          state_name: 'State 3',
          content_id: 'content',
          language_code: 'hi',
          content_html: '<p>old content html</p>',
          translation_html: '<p>In Hindi</p>'
        };
        spyOn(contributionAndReviewService, 'updateTranslationSuggestionAsync')
          .and.callFake((
              suggestionId, translationHtml,
              successCallback, errorCallback) => {
            successCallback();
          });

        $scope.updateSuggestion();

        expect(contributionAndReviewService.updateTranslationSuggestionAsync)
          .toHaveBeenCalledWith(
            'suggestion_1', $scope.editedContent.html,
            jasmine.any(Function),
            jasmine.any(Function));
      });
  });

  describe('when viewing suggestion', function() {
    const reviewable = false;
    let $q = null;
    let $rootScope = null;
    const subheading = 'subheading_title';
    let ThreadDataBackendApiService = null;

    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: ['Translation1', 'Translation2'],
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: ['Translation1', 'Translation2 CHANGED'],
      status: 'rejected'
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: 'Translation'
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: null
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2'
      }
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2
    };

    beforeEach(angular.mock.inject(function($injector, $controller) {
      $rootScope = $injector.get('$rootScope');
      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);
      $q = $injector.get('$q');
      ThreadDataBackendApiService = $injector.get(
        'ThreadDataBackendApiService');

      $scope = $rootScope.$new();
      $controller('TranslationSuggestionReviewModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        initialSuggestionId: 'suggestion_1',
        subheading: subheading,
        reviewable: reviewable,
        suggestionIdToContribution: angular.copy(suggestionIdToContribution)
      });
    }));

    it(
      'should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.activeSuggestionId).toBe('suggestion_1');
        expect($scope.activeSuggestion).toEqual(suggestion1);
        expect($scope.reviewable).toBe(reviewable);
        expect($scope.subheading).toBe('subheading_title');
        // Suggestion 1's exploration_content_html does not match its
        // content_html.
        expect($scope.hasExplorationContentChanged()).toBe(true);

        const messages = [{
          author_username: '',
          created_om_msecs: 0,
          entity_type: '',
          entity_id: '',
          message_id: '',
          text: '',
          updated_status: '',
          updated_subject: '',
        }];

        const fetchMessagesAsyncSpy = spyOn(
          ThreadDataBackendApiService, 'fetchMessagesAsync')
          .and.returnValue($q.resolve({
            messages: messages
          }));

        $scope.init();
        $rootScope.$apply();

        expect(fetchMessagesAsyncSpy).toHaveBeenCalledWith('suggestion_1');
        expect($scope.reviewMessage).toBe('');
      });
  });

  describe('when reviewing suggestions' +
    ' with deleted opportunites', function() {
    const reviewable = false;
    const subheading = 'subheading_title';

    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: ['Translation1', 'Translation2'],
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: ['Translation1', 'Translation2 CHANGED'],
      status: 'rejected'
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: 'Translation'
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: null
    };

    const deletedContribution = {
      suggestion: suggestion2,
      details: null
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_deleted: deletedContribution,
    };

    beforeEach(angular.mock.inject(function($injector, $controller) {
      const $rootScope = $injector.get('$rootScope');
      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller('TranslationSuggestionReviewModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        initialSuggestionId: 'suggestion_1',
        subheading: subheading,
        reviewable: reviewable,
        suggestionIdToContribution: angular.copy(suggestionIdToContribution)
      });
    }));

    it('should reject suggestion in suggestion modal service when clicking ' +
      'on reject and review next suggestion button', function() {
      expect($scope.activeSuggestionId).toBe('suggestion_1');
      expect($scope.activeSuggestion).toEqual(suggestion1);
      expect($scope.reviewable).toBe(reviewable);
      expect($scope.reviewMessage).toBe('');

      spyOn(contributionAndReviewService, 'resolveSuggestionToExploration')
        .and.callFake((
            targetId, suggestionId, action, reviewMessage, commitMessage,
            callback) => {
          callback();
        });
      spyOn(
        SiteAnalyticsService,
        'registerContributorDashboardRejectSuggestion');
      $scope.reviewMessage = 'Review message example';

      $scope.rejectAndReviewNext();

      expect(
        SiteAnalyticsService.registerContributorDashboardRejectSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '1', 'suggestion_1', 'reject', 'Review message example',
          'hint section of "StateName" card', $scope.showNextItemToReview);
      expect($uibModalInstance.close).toHaveBeenCalledWith([
        'suggestion_1']);
    });
  });
});
