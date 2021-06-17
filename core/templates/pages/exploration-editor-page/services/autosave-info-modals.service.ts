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
 * @fileoverview Service for displaying different types of modals depending
 * on the type of response received as a result of the autosaving request.
 */

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('services/local-storage.service.ts');
require(
  'pages/exploration-editor-page/modal-templates/' +
  'save-validation-fail-modal.controller.ts');
require(
  'pages/exploration-editor-page/modal-templates/' +
  'save-version-mismatch-modal.controller.ts');
require(
  'pages/exploration-editor-page/modal-templates/' +
  'lost-changes-modal.controller.ts');

angular.module('oppia').factory('AutosaveInfoModalsService', [
  '$uibModal', 'LocalStorageService', 'UrlInterpolationService',
  function(
      $uibModal, LocalStorageService, UrlInterpolationService) {
    var _isModalOpen = false;

    return {
      showNonStrictValidationFailModal: function() {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/modal-templates/' +
            'save-validation-fail-modal.template.html'),
          // Prevent modal from closing when the user clicks outside it.
          backdrop: 'static',
          controller: 'SaveValidationFailModalController'
        }).result.then(function() {
          _isModalOpen = false;
        }, function() {
          _isModalOpen = false;
        });

        _isModalOpen = true;
      },
      isModalOpen: function() {
        return _isModalOpen;
      },
      showVersionMismatchModal: function(lostChanges) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/modal-templates/' +
            'save-version-mismatch-modal.template.html'),
          // Prevent modal from closing when the user clicks outside it.
          backdrop: 'static',
          resolve: {
            lostChanges: () => lostChanges
          },
          controller: 'SaveVersionMismatchModalController',
          windowClass: 'oppia-autosave-version-mismatch-modal'
        }).result.then(function() {
          _isModalOpen = false;
        }, function() {
          _isModalOpen = false;
        });

        _isModalOpen = true;
      },
      showLostChangesModal: function(lostChanges, explorationId) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/modal-templates/' +
            'lost-changes-modal.template.html'),
          // Prevent modal from closing when the user clicks outside it.
          backdrop: 'static',
          resolve: {
            lostChanges: () => lostChanges
          },
          controller: 'LostChangesModalController',
          windowClass: 'oppia-lost-changes-modal'
        }).result.then(function() {
          _isModalOpen = false;
        }, function() {
          // When the user clicks on discard changes button, signal backend
          // to discard the draft and reload the page thereafter.
          LocalStorageService.removeExplorationDraft(explorationId);
          _isModalOpen = false;
        });

        _isModalOpen = true;
      }
    };
  }
]);
