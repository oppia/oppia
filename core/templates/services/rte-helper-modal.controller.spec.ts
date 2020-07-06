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
 * @fileoverview Unit tests for RteHelperModalController.
 */

import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ANGULAR_SERVICES, ANGULAR_SERVICES_NAMES } from
  'tests/angular-services.index';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('Rte Helper Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var $timeout = null;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [...ANGULAR_SERVICES],
      schemas: [NO_ERRORS_SCHEMA]
    });
  });

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    for (let i in ANGULAR_SERVICES) {
      $provide.value(ANGULAR_SERVICES_NAMES[i],
        TestBed.get(ANGULAR_SERVICES[i]));
    }
  }));

  describe('when customization args has a valid youtube video', function() {
    var customizationArgSpecs = [{
      name: 'heading',
      default_value: 'default value'
    }, {
      name: 'video_id',
      default_value: 'https://www.youtube.com/watch?v=Ntcw0H0hwPU'
    }];
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $timeout = $injector.get('$timeout');
      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller(
        'RteHelperModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          attrsCustomizationArgsDict: {
            heading: 'This value is not default.'
          },
          customizationArgSpecs: customizationArgSpecs,
        });
    }));

    it('should load modal correctly', function() {
      expect($scope.customizationArgSpecs).toEqual(customizationArgSpecs);
      expect($scope.modalIsLoading).toBe(true);
      $timeout.flush();
      expect($scope.modalIsLoading).toBe(false);
    });

    it('should close modal when clicking on cancel button', function() {
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should save modal customization args when closing it', function() {
      var broadcastSpy = spyOn($scope, '$broadcast').and.callThrough();
      $scope.save();
      expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
      expect($uibModalInstance.close).toHaveBeenCalledWith({
        heading: 'This value is not default.',
        video_id: 'Ntcw0H0hwPU'
      });
    });
  });

  describe('when customization args doesn\'t have a valid youtube video',
    function() {
      var customizationArgSpecs = [{
        name: 'heading',
        default_value: ''
      }, {
        name: 'video_id',
        default_value: 'https://www.youtube.com'
      }];

      beforeEach(() => {
        TestBed.configureTestingModule({
          imports: [HttpClientTestingModule],
          providers: [...ANGULAR_SERVICES],
          schemas: [NO_ERRORS_SCHEMA]
        });
      });
      beforeEach(angular.mock.module('oppia'));
      beforeEach(angular.mock.module('oppia', function($provide) {
        for (let i in ANGULAR_SERVICES) {
          $provide.value(ANGULAR_SERVICES_NAMES[i],
            TestBed.get(ANGULAR_SERVICES[i]));
        }
      }));
      beforeEach(angular.mock.inject(function($injector, $controller) {
        $timeout = $injector.get('$timeout');
        var $rootScope = $injector.get('$rootScope');

        $uibModalInstance = jasmine.createSpyObj(
          '$uibModalInstance', ['close', 'dismiss']);

        $scope = $rootScope.$new();
        $controller(
          'RteHelperModalController', {
            $scope: $scope,
            $uibModalInstance: $uibModalInstance,
            attrsCustomizationArgsDict: {
              heading: {}
            },
            customizationArgSpecs: customizationArgSpecs,
          });
      }));

      it('should load modal correctly', function() {
        expect($scope.customizationArgSpecs).toEqual(customizationArgSpecs);
        expect($scope.modalIsLoading).toBe(true);
        $timeout.flush();
        expect($scope.modalIsLoading).toBe(false);
      });

      it('should close modal when clicking on cancel button', function() {
        $scope.cancel();
        expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
      });

      it('should save modal customization args when closing it', function() {
        var broadcastSpy = spyOn($scope, '$broadcast').and.callThrough();
        $scope.save();
        expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
        expect($uibModalInstance.close).toHaveBeenCalledWith({
          heading: {},
          video_id: 'https://www.youtube.com'
        });
      });
    });
});
