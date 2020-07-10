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
import { AppConstants } from 'app.constants';

describe('Rte Helper Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var $timeout = null;

  describe('when customization args has a valid youtube video', function() {
    var customizationArgSpecs = [{
      name: 'heading',
      default_value: 'default value'
    }, {
      name: 'video_id',
      default_value: 'https://www.youtube.com/watch?v=Ntcw0H0hwPU'
    }];

    beforeEach(angular.mock.module('oppia'));
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
      expect($scope.disableSaveButtonForMathRte()).toBe(false);
      $scope.save();
      expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
      expect($uibModalInstance.close).toHaveBeenCalledWith({
        heading: 'This value is not default.',
        video_id: 'Ntcw0H0hwPU'
      });
    });
  });

  describe('when the editor is Math expression editor', function() {
    var customizationArgSpecs = [{
      name: 'math_content',
      default_value: {
        raw_latex: '',
        svg_filename: ''
      }
    }];
    var $q = null;
    var AssetsBackendApiService = null;
    var ImageUploadHelperService = null;
    var ImageLocalStorageService = null;
    var ContextService = null;
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $timeout = $injector.get('$timeout');
      var $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');

      AssetsBackendApiService = $injector.get('AssetsBackendApiService');
      ImageUploadHelperService = $injector.get('ImageUploadHelperService');
      ImageLocalStorageService = $injector.get('ImageLocalStorageService');
      ContextService = $injector.get('ContextService');
      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller(
        'RteHelperModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          attrsCustomizationArgsDict: {
            math_content: {
              raw_latex: '',
              svg_filename: ''
            }
          },
          customizationArgSpecs: customizationArgSpecs,
        });
    }));

    it('should load modal correctly', function() {
      expect($scope.customizationArgSpecs).toEqual(customizationArgSpecs);
      expect($scope.currentRteIsMathExpressionEditor).toBe(true);
    });

    it('should close modal when clicking on cancel button', function() {
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should save modal customization args when closing it', function() {
      var broadcastSpy = spyOn($scope, '$broadcast').and.callThrough();
      $scope.tmpCustomizationArgs = [{
        name: 'math_content',
        value: {
          raw_latex: 'x^2',
          svgFile: 'Svg Data',
          svg_filename: 'mathImage.svg',
          mathExpressionSvgIsBeingProcessed: true
        }
      }];
      expect($scope.disableSaveButtonForMathRte()).toBe(true);
      $scope.tmpCustomizationArgs[0].value.mathExpressionSvgIsBeingProcessed = (
        false);
      expect($scope.disableSaveButtonForMathRte()).toBe(false);
      var response = {
        filename: 'mathImage.svg'
      };
      var imageFile = new Blob();
      spyOn(AssetsBackendApiService, 'saveMathExpresionImage').and.returnValue(
        $q.resolve(response));
      spyOn(
        ImageUploadHelperService,
        'convertImageDataToImageFile').and.returnValue(imageFile);
      $scope.save();
      $scope.$apply();
      expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
      expect($uibModalInstance.close).toHaveBeenCalledWith({
        math_content: {
          raw_latex: 'x^2',
          svg_filename: 'mathImage.svg'
        }
      });
    });

    it('should cancel the modal when saving of math SVG fails', function() {
      var broadcastSpy = spyOn($scope, '$broadcast').and.callThrough();
      $scope.tmpCustomizationArgs = [{
        name: 'math_content',
        value: {
          raw_latex: 'x^2',
          svgFile: 'Svg Data',
          svg_filename: 'mathImage.svg'
        }
      }];
      var response = {
        filename: 'mathImage.svg'
      };
      var imageFile = new Blob();
      spyOn(AssetsBackendApiService, 'saveMathExpresionImage').and.returnValue(
        $q.reject({}));
      spyOn(
        ImageUploadHelperService,
        'convertImageDataToImageFile').and.returnValue(imageFile);
      $scope.save();
      $scope.$apply();
      expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should cancel the modal when if the rawLatex or filename field is' +
       'empty for a math expression', function() {
      var broadcastSpy = spyOn($scope, '$broadcast').and.callThrough();
      $scope.tmpCustomizationArgs = [{
        name: 'math_content',
        value: {
          raw_latex: '',
          svgFile: null,
          svg_filename: ''
        }
      }];
      $scope.save();
      $scope.$apply();
      expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should save modal customization args while in local storage',
      function() {
        var broadcastSpy = spyOn($scope, '$broadcast').and.callThrough();
        $scope.tmpCustomizationArgs = [{
          name: 'math_content',
          value: {
            raw_latex: 'x^2',
            svgFile: 'Svg Data',
            svg_filename: 'mathImage.svg'
          }
        }];
        var response = {
          filename: 'mathImage.svg'
        };
        var imageFile = new Blob();
        spyOn(ContextService, 'getImageSaveDestination').and.returnValue(
          AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
        spyOn(
          ImageUploadHelperService,
          'convertImageDataToImageFile').and.returnValue(imageFile);
        $scope.save();
        $scope.$apply();
        expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
        expect($uibModalInstance.close).toHaveBeenCalledWith({
          math_content: {
            raw_latex: 'x^2',
            svg_filename: 'mathImage.svg'
          }
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

      beforeEach(angular.mock.module('oppia'));
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
