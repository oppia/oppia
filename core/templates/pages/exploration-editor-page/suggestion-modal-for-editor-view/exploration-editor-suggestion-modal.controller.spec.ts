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
 * @fileoverview Unit tests for ExplorationEditorSuggestionModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Exploration Editor Suggestion Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var EditabilityService = null;
  var SuggestionModalService = null;

  var currentContent = 'Current Content';
  var newContent = 'New Content';
  var suggestionStatus = 'rejected';

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  describe('when suggestion is already rejected', function() {
    var suggestionIsHandled = true;
    var suggestionIsValid = true;
    var threadUibModalInstance = null;
    var unsavedChangesExist = true;

    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');
      EditabilityService = $injector.get('EditabilityService');
      SuggestionModalService = $injector.get('SuggestionModalService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(EditabilityService, 'isEditable').and.returnValue(true);

      $scope = $rootScope.$new();
      $controller('ExplorationEditorSuggestionModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        currentContent: currentContent,
        newContent: newContent,
        suggestionIsHandled: suggestionIsHandled,
        suggestionIsValid: suggestionIsValid,
        suggestionStatus: suggestionStatus,
        threadUibModalInstance: threadUibModalInstance,
        unsavedChangesExist: unsavedChangesExist,
      });
    }));

    it('should check properties set after controller is initialized',
      function() {
        expect($scope.isNotHandled).toEqual(false);
        expect($scope.canEdit).toBe(true);
        expect($scope.commitMessage).toBe('');
        expect($scope.reviewMessage).toBe('');
        expect($scope.canReject).toBe(false);
        expect($scope.canAccept).toBe(false);
        expect($scope.currentContent).toBe(currentContent);
        expect($scope.newContent).toBe(newContent);
        expect($scope.errorMessage).toBe(
          'This suggestion has already been rejected.');
      });

    it('should accept suggestion', function() {
      spyOn(SuggestionModalService, 'acceptSuggestion').and.callThrough();
      $scope.acceptSuggestion();

      expect(SuggestionModalService.acceptSuggestion).toHaveBeenCalled();
    });

    it('should reject suggestion', function() {
      spyOn(SuggestionModalService, 'rejectSuggestion').and.callThrough();
      $scope.rejectSuggestion();

      expect(SuggestionModalService.rejectSuggestion).toHaveBeenCalled();
    });

    it('should cancel review', function() {
      spyOn(SuggestionModalService, 'cancelSuggestion').and.callThrough();
      $scope.cancelReview();

      expect(SuggestionModalService.cancelSuggestion).toHaveBeenCalledWith(
        $uibModalInstance);
    });
  });

  describe('when suggestion is from a state that doesn\'t exist anymore',
    function() {
      var suggestionIsHandled = false;
      var suggestionIsValid = false;
      var threadUibModalInstance = null;
      var unsavedChangesExist = true;

      beforeEach(angular.mock.inject(function($injector, $controller) {
        var $rootScope = $injector.get('$rootScope');
        EditabilityService = $injector.get('EditabilityService');
        SuggestionModalService = $injector.get('SuggestionModalService');

        $uibModalInstance = jasmine.createSpyObj(
          '$uibModalInstance', ['close', 'dismiss']);

        spyOn(EditabilityService, 'isEditable').and.returnValue(true);

        $scope = $rootScope.$new();
        $controller('ExplorationEditorSuggestionModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          currentContent: currentContent,
          newContent: newContent,
          suggestionIsHandled: suggestionIsHandled,
          suggestionIsValid: suggestionIsValid,
          suggestionStatus: suggestionStatus,
          threadUibModalInstance: threadUibModalInstance,
          unsavedChangesExist: unsavedChangesExist,
        });
      }));

      it('should check properties set after controller is initialized',
        function() {
          expect($scope.isNotHandled).toEqual(true);
          expect($scope.canEdit).toBe(true);
          expect($scope.commitMessage).toBe('');
          expect($scope.reviewMessage).toBe('');
          expect($scope.canReject).toBe(true);
          expect($scope.canAccept).toBe(false);
          expect($scope.currentContent).toBe(currentContent);
          expect($scope.newContent).toBe(newContent);
          expect($scope.errorMessage).toBe(
            'This suggestion was made for a state that no longer exists.' +
            ' It cannot be accepted.');
        });
    });

  describe('when exploration has unsaved changes', function() {
    var suggestionIsHandled = false;
    var suggestionIsValid = true;
    var threadUibModalInstance = null;
    var unsavedChangesExist = true;

    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');
      EditabilityService = $injector.get('EditabilityService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(EditabilityService, 'isEditable').and.returnValue(true);

      $scope = $rootScope.$new();
      $controller('ExplorationEditorSuggestionModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        currentContent: currentContent,
        newContent: newContent,
        suggestionIsHandled: suggestionIsHandled,
        suggestionIsValid: suggestionIsValid,
        suggestionStatus: suggestionStatus,
        threadUibModalInstance: threadUibModalInstance,
        unsavedChangesExist: unsavedChangesExist,
      });
    }));

    it('should check properties set after controller is initialized',
      function() {
        expect($scope.isNotHandled).toEqual(true);
        expect($scope.canEdit).toBe(true);
        expect($scope.commitMessage).toBe('');
        expect($scope.reviewMessage).toBe('');
        expect($scope.canReject).toBe(true);
        expect($scope.canAccept).toBe(false);
        expect($scope.currentContent).toBe(currentContent);
        expect($scope.newContent).toBe(newContent);
        expect($scope.errorMessage).toEqual(
          'You have unsaved changes to this exploration. Please save/discard' +
          ' your unsaved changes if you wish to accept.');
      });
  });

  describe('when suggestion is valid but not handled and no exist changes' +
    ' exist', function() {
    var suggestionIsHandled = false;
    var suggestionIsValid = true;
    var threadUibModalInstance = null;
    var unsavedChangesExist = false;

    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');
      SuggestionModalService = $injector.get('SuggestionModalService');
      EditabilityService = $injector.get('EditabilityService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      threadUibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(EditabilityService, 'isEditable').and.returnValue(true);

      $scope = $rootScope.$new();
      $controller('ExplorationEditorSuggestionModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        currentContent: currentContent,
        newContent: newContent,
        suggestionIsHandled: suggestionIsHandled,
        suggestionIsValid: suggestionIsValid,
        suggestionStatus: suggestionStatus,
        threadUibModalInstance: threadUibModalInstance,
        unsavedChangesExist: unsavedChangesExist,
      });
    }));

    it('should check properties set after controller is initialized',
      function() {
        expect($scope.isNotHandled).toEqual(true);
        expect($scope.canEdit).toBe(true);
        expect($scope.commitMessage).toBe('');
        expect($scope.reviewMessage).toBe('');
        expect($scope.canReject).toBe(true);
        expect($scope.canAccept).toBe(true);
        expect($scope.currentContent).toBe(currentContent);
        expect($scope.newContent).toBe(newContent);
        expect($scope.errorMessage).toBe('');
      });

    it('should accept suggestion', function() {
      spyOn(SuggestionModalService, 'acceptSuggestion').and.callThrough();
      $scope.acceptSuggestion();

      expect(threadUibModalInstance.close).toHaveBeenCalled();
      expect(SuggestionModalService.acceptSuggestion).toHaveBeenCalled();
    });

    it('should reject suggestion', function() {
      spyOn(SuggestionModalService, 'rejectSuggestion').and.callThrough();
      $scope.rejectSuggestion();

      expect(threadUibModalInstance.close).toHaveBeenCalled();
      expect(SuggestionModalService.rejectSuggestion).toHaveBeenCalled();
    });
  });
});
