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
 * @fileoverview Unit tests for AddAudioTranslationModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Add Audio Translation Modal Controller', function() {
  var $q = null;
  var $scope = null;
  var $uibModalInstance = null;
  var AssetsBackendApiService = null;
  var ContextService = null;

  var audioFile = new File([], '');
  var generatedFilename = 'new_audio_file.mp3';
  var isAudioAvailable = true;
  var languageCode = 'en';

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    AssetsBackendApiService = $injector.get('AssetsBackendApiService');
    ContextService = $injector.get('ContextService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('AddAudioTranslationModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      audioFile: audioFile,
      generatedFilename: generatedFilename,
      isAudioAvailable: isAudioAvailable,
      languageCode: languageCode
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.errorMessage).toBe(null);
      expect($scope.saveButtonText).toBe('Save');
      expect($scope.saveInProgress).toBe(false);
      expect($scope.isAudioAvailable).toBe(isAudioAvailable);
      expect($scope.droppedFile).toBe(audioFile);
    });

  it('should save audio successfully then close the modal', function() {
    var file = {
      size: 1000,
      name: 'file.mp3'
    };
    $scope.updateUploadedFile(file);

    spyOn(ContextService, 'getExplorationId').and.returnValue('exp1');

    var response = {
      duration_secs: 10
    };
    spyOn(AssetsBackendApiService, 'saveAudio').and.returnValue(
      $q.resolve(response));
    $scope.confirm();
    $scope.$apply();

    expect($scope.saveButtonText).toBe('Saving...');
    expect($scope.saveInProgress).toBe(true);
    expect($uibModalInstance.close).toHaveBeenCalledWith({
      languageCode: languageCode,
      filename: generatedFilename,
      fileSizeBytes: file.size,
      durationSecs: response.duration_secs
    });
  });

  it('should use reject handler when trying to save audio fails', function() {
    var file = {
      size: 1000,
      name: 'file.mp3'
    };
    $scope.updateUploadedFile(file);

    spyOn(ContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(AssetsBackendApiService, 'saveAudio').and.returnValue($q.reject({}));
    $scope.confirm();

    expect($scope.saveButtonText).toBe('Saving...');
    expect($scope.saveInProgress).toBe(true);

    $scope.$apply();

    expect($scope.errorMessage).toBe(
      'There was an error uploading the audio file.');
    expect($scope.saveButtonText).toBe('Save');
    expect($scope.saveInProgress).toBe(false);
    expect($uibModalInstance.close).not.toHaveBeenCalled();

    $scope.clearUploadedFile();
    expect($scope.errorMessage).toBe(null);
  });
});
