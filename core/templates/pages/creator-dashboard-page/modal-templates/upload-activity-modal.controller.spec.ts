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
 * @fileoverview Unit tests for UploadActivityModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// file is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Upload Activity Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var AlertsService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    AlertsService = $injector.get('AlertsService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('UploadActivityModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
  }));

  it('should save activity', function() {
    var documentCopy = angular.copy(document);
    var file = {
      size: 100,
      name: 'file.mp3'
    };
    // TODO(#10113): Refactor the code to not use the DOM methods.
    // This throws "Argument of type '() => { files: { size: number;
    // name: string; }[]; }' is not assignable to parameter of type
    // '(elementId: string) => HTMLElement'.". This is because the
    // actual 'getElementById' returns more properties than just "files".
    // We need to suppress this error because we need only "files"
    // property for testing.
    // @ts-expect-error
    spyOn(document, 'getElementById').and.callFake(function() {
      return {
        files: [file]
      };
    });
    $scope.save();

    expect($uibModalInstance.close).toHaveBeenCalledWith({
      yamlFile: file
    });
    document = documentCopy;
  });

  it('should not save activity if file is empty', function() {
    var documentCopy = angular.copy(document);
    spyOn(AlertsService, 'addWarning').and.callThrough();
    // TODO(#10113): Refactor the code to not use the DOM methods.
    // This throws "Argument of type '() => { files: { size: number;
    // name: string; }[]; }' is not assignable to parameter of type
    // '(elementId: string) => HTMLElement'.". This is because the
    // actual 'getElementById' returns more properties than just "files".
    // We need to suppress this error because we need only "files"
    // property for testing.
    // @ts-expect-error
    spyOn(document, 'getElementById').and.callFake(function() {
      return {
        files: []
      };
    });
    $scope.save();

    expect(AlertsService.addWarning).toHaveBeenCalledWith(
      'Empty file detected.');
    expect($uibModalInstance.close).not.toHaveBeenCalled();
    document = documentCopy;
  });
});
