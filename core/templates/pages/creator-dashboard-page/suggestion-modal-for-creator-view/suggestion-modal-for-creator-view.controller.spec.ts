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
 * @fileoverview Unit tests for SuggestionModalForCreatorViewController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Suggestion Modal For Creator View Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  describe('when suggestion is handled and it is accepted', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller(
        'SuggestionModalForCreatorViewController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          canReviewActiveThread: true,
          description: 'Description',
          newContent: {
            html: 'New content'
          },
          oldContent: {
            html: 'Old content'
          },
          stateName: 'Init',
          suggestionIsHandled: true,
          suggestionStatus: 'accepted',
          suggestionType: 'accept'
        });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.isNotHandled).toBe(false);
        expect($scope.canReject).toBe(false);
        expect($scope.canAccept).toBe(false);
        expect($scope.errorMessage).toBe(
          'This suggestion has already been accepted.');
        expect($scope.isSuggestionRejected).toBe(false);
        expect($scope.oldContent).toEqual({
          html: 'Old content'
        });
        expect($scope.newContent).toEqual({
          html: 'New content'
        });
        expect($scope.stateName).toBe('Init');
        expect($scope.suggestionType).toBe('accept');
        expect($scope.commitMessage).toBe('Description');
        expect($scope.reviewMessage).toBe(null);
        expect($scope.summaryMessage).toBe(null);
        expect($scope.canReviewActiveThread).toBe(true);
        $scope.updateValue('New content');
        expect($scope.suggestionData).toEqual(
          {newSuggestionHtml: 'New content'});
        expect($scope.suggestionEditorIsShown).toBe(false);
      });

    it('should accept suggestion', function() {
      $scope.acceptSuggestion();

      expect($uibModalInstance.close).toHaveBeenCalledWith({
        action: 'accept',
        commitMessage: 'Description',
        reviewMessage: null
      });
    });

    it('should reject suggestion', function() {
      $scope.rejectSuggestion();

      expect($uibModalInstance.close).toHaveBeenCalledWith({
        action: 'reject',
        commitMessage: null,
        reviewMessage: null
      });
    });

    it('should toggle edit mode suggestion', function() {
      expect($scope.suggestionEditorIsShown).toBe(false);
      $scope.editSuggestion();
      expect($scope.suggestionEditorIsShown).toBe(true);
      $scope.cancelEditMode();
      expect($scope.suggestionEditorIsShown).toBe(false);
    });

    it('should cancel suggestion', function() {
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should evalute if edit button is showing', function() {
      expect($scope.isEditButtonShown()).toBe(false);
    });

    it('should evalute if resubmit button is showing', function() {
      expect($scope.isResubmitButtonShown()).toBe(false);
    });

    it('should evalute when resubmit button is disabled', function() {
      spyOn($scope, 'summaryMessage').and.returnValue('Message');
      expect($scope.isResubmitButtonDisabled()).toBe(true);
    });

    it('should resubmit changes', function() {
      $scope.resubmitChanges();
      expect($uibModalInstance.close).toHaveBeenCalledWith({
        action: 'resubmit',
        newSuggestionHtml: 'New content',
        summaryMessage: null,
        stateName: 'Init',
        suggestionType: 'accept',
        oldContent: {
          html: 'Old content'
        }
      });
    });
  });

  describe('when suggestion is handled and it is rejected', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller(
        'SuggestionModalForCreatorViewController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          canReviewActiveThread: true,
          description: 'Description',
          newContent: {
            html: 'New content'
          },
          oldContent: {
            html: 'Old content'
          },
          stateName: 'Init',
          suggestionIsHandled: true,
          suggestionStatus: 'rejected',
          suggestionType: 'reject'
        });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.isNotHandled).toBe(false);
        expect($scope.canReject).toBe(false);
        expect($scope.canAccept).toBe(false);
        expect($scope.errorMessage).toBe(
          'This suggestion has already been rejected.');
        expect($scope.isSuggestionRejected).toBe(true);
        expect($scope.oldContent).toEqual({
          html: 'Old content'
        });
        expect($scope.newContent).toEqual({
          html: 'New content'
        });
        expect($scope.stateName).toBe('Init');
        expect($scope.suggestionType).toBe('reject');
        expect($scope.commitMessage).toBe('Description');
        expect($scope.reviewMessage).toBe(null);
        expect($scope.summaryMessage).toBe(null);
        expect($scope.canReviewActiveThread).toBe(true);
        expect($scope.suggestionData).toEqual(
          {newSuggestionHtml: 'New content'});
        expect($scope.suggestionEditorIsShown).toBe(false);
      });

    it('should toggle edit mode suggestion', function() {
      expect($scope.suggestionEditorIsShown).toBe(false);
      expect($scope.isEditButtonShown()).toBe(true);
      expect($scope.isResubmitButtonShown()).toBe(false);
      $scope.editSuggestion();
      expect($scope.suggestionEditorIsShown).toBe(true);
      expect($scope.isEditButtonShown()).toBe(false);
      expect($scope.isResubmitButtonShown()).toBe(true);
      $scope.cancelEditMode();
      expect($scope.suggestionEditorIsShown).toBe(false);
      expect($scope.isEditButtonShown()).toBe(true);
      expect($scope.isResubmitButtonShown()).toBe(false);
    });

    it('should evalute when resubmit button is disabled', function() {
      spyOn($scope, 'summaryMessage').and.returnValue('Message');
      expect($scope.isResubmitButtonDisabled()).toBe(true);
    });

    it('should resubmit changes', function() {
      $scope.resubmitChanges();
      expect($uibModalInstance.close).toHaveBeenCalledWith({
        action: 'resubmit',
        newSuggestionHtml: 'New content',
        summaryMessage: null,
        stateName: 'Init',
        suggestionType: 'reject',
        oldContent: {
          html: 'Old content'
        }
      });
    });
  });

  describe('when suggestion is not handled', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller(
        'SuggestionModalForCreatorViewController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          canReviewActiveThread: true,
          description: 'Description',
          newContent: {
            html: 'Same content'
          },
          oldContent: {
            html: 'Same content'
          },
          stateName: 'Init',
          suggestionIsHandled: false,
          suggestionStatus: 'accepted',
          suggestionType: 'accept'
        });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.isNotHandled).toBe(true);
        expect($scope.canReject).toBe(true);
        expect($scope.canAccept).toBe(true);
        expect($scope.errorMessage).toBe('');
        expect($scope.isSuggestionRejected).toBe(undefined);
        expect($scope.oldContent).toEqual({
          html: 'Same content'
        });
        expect($scope.oldContent).toEqual({
          html: 'Same content'
        });
        expect($scope.stateName).toBe('Init');
        expect($scope.suggestionType).toBe('accept');
        expect($scope.commitMessage).toBe('Description');
        expect($scope.reviewMessage).toBe(null);
        expect($scope.summaryMessage).toBe(null);
        expect($scope.canReviewActiveThread).toBe(true);
        expect($scope.suggestionData).toEqual(
          {newSuggestionHtml: 'Same content'});
        expect($scope.suggestionEditorIsShown).toBe(false);
      });

    it('should evalute if edit button is showing', function() {
      expect($scope.isEditButtonShown()).toBe(false);
    });

    it('should evalute if resubmit button is showing', function() {
      expect($scope.isResubmitButtonShown()).toBe(false);
    });

    it('should evalute when resubmit button is disabled', function() {
      spyOn($scope, 'summaryMessage').and.returnValue('Message');
      expect($scope.isResubmitButtonDisabled()).toBe(true);
    });

    it('should resubmit changes', function() {
      $scope.resubmitChanges();
      expect($uibModalInstance.close).toHaveBeenCalledWith({
        action: 'resubmit',
        newSuggestionHtml: 'Same content',
        summaryMessage: null,
        stateName: 'Init',
        suggestionType: 'accept',
        oldContent: {
          html: 'Same content'
        }
      });
    });
  });
});
