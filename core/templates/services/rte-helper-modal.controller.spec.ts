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

import { EventEmitter } from '@angular/core';
import { AppConstants } from 'app.constants';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Rte Helper Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var $timeout = null;

  var mockExternalRteSaveEventEmitter = null;

  importAllAngularServices();

  describe('when customization args has a valid youtube video', function() {
    var ContextService = null;
    var customizationArgSpecs = [{
      name: 'heading',
      default_value: 'default value'
    }, {
      name: 'video_id',
      default_value: 'https://www.youtube.com/watch?v=Ntcw0H0hwPU'
    }];

    beforeEach(angular.mock.module('oppia'));

    beforeEach(angular.mock.module('oppia', function($provide) {
      mockExternalRteSaveEventEmitter = new EventEmitter();
      $provide.value('ExternalRteSaveService', {
        onExternalRteSave: mockExternalRteSaveEventEmitter
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $controller) {
      $timeout = $injector.get('$timeout');
      var $rootScope = $injector.get('$rootScope');
      ContextService = $injector.get('ContextService');

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
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith(false);
    });

    it('should save modal customization args when closing it', function() {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(ContextService, 'getEntityType').and.returnValue('exploration');

      expect($scope.disableSaveButtonForMathRte()).toBe(false);
      $scope.save();
      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
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
    var ContextService = null;
    beforeEach(angular.mock.module('oppia'));

    beforeEach(angular.mock.module('oppia', function($provide) {
      mockExternalRteSaveEventEmitter = new EventEmitter();
      $provide.value('ExternalRteSaveService', {
        onExternalRteSave: mockExternalRteSaveEventEmitter
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $controller) {
      $timeout = $injector.get('$timeout');
      var $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');

      AssetsBackendApiService = $injector.get('AssetsBackendApiService');
      ImageUploadHelperService = $injector.get('ImageUploadHelperService');
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
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith(false);
    });

    it('should save modal customization args when closing it', function() {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(ContextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
      spyOn(ContextService, 'getEntityType').and.returnValue('exploration');
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
      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect($uibModalInstance.close).toHaveBeenCalledWith({
        math_content: {
          raw_latex: 'x^2',
          svg_filename: 'mathImage.svg'
        }
      });
    });

    it('should cancel the modal when saving of math SVG fails', function() {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(ContextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
      spyOn(ContextService, 'getEntityType').and.returnValue('exploration');
      $scope.tmpCustomizationArgs = [{
        name: 'math_content',
        value: {
          raw_latex: 'x^2',
          svgFile: 'Svg Data',
          svg_filename: 'mathImage.svg'
        }
      }];
      var imageFile = new Blob();
      spyOn(AssetsBackendApiService, 'saveMathExpresionImage').and.returnValue(
        $q.reject({}));
      spyOn(
        ImageUploadHelperService,
        'convertImageDataToImageFile').and.returnValue(imageFile);
      $scope.save();
      $scope.$apply();
      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should cancel the modal when math SVG exceeds 100 KB', function() {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(ContextService, 'getEntityType').and.returnValue('exploration');
      $scope.tmpCustomizationArgs = [{
        name: 'math_content',
        value: {
          raw_latex: 'x^2 + y^2 + x^2 + y^2 + x^2 + y^2 + x^2 + y^2 + x^2',
          svgFile: 'Svg Data',
          svg_filename: 'mathImage.svg'
        }
      }];
      var imageFile = (
        new Blob(
          [new ArrayBuffer(102 * 1024)], {type: 'application/octet-stream'}));
      spyOn(
        ImageUploadHelperService,
        'convertImageDataToImageFile').and.returnValue(imageFile);
      $scope.save();
      $scope.$apply();
      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should cancel the modal when SVG exceeds 1 MB for blog post',
      function() {
        spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
        spyOn(ContextService, 'getEntityType').and.returnValue('blog_post');
        $scope.tmpCustomizationArgs = [{
          name: 'math_content',
          value: {
            raw_latex: 'x^2 + y^2 + x^2 + y^2 + x^2 + y^2 + x^2 + y^2 + x^2',
            svgFile: 'Svg Data',
            svg_filename: 'mathImage.svg'
          }
        }];
        var imageFile = (
          new Blob(
            [new ArrayBuffer(102 * 1024 * 1024)],
            {type: 'application/octet-stream'})
        );
        spyOn(
          ImageUploadHelperService,
          'convertImageDataToImageFile').and.returnValue(imageFile);
        $scope.save();
        $scope.$apply();
        expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
        expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
      });

    it('should cancel the modal when if the rawLatex or filename field is' +
       'empty for a math expression', function() {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(ContextService, 'getEntityType').and.returnValue('exploration');
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
      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should save modal customization args while in local storage',
      function() {
        spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
        spyOn(ContextService, 'getEntityType').and.returnValue('exploration');
        $scope.tmpCustomizationArgs = [{
          name: 'math_content',
          value: {
            raw_latex: 'x^2',
            svgFile: 'Svg Data',
            svg_filename: 'mathImage.svg'
          }
        }];

        var imageFile = new Blob();
        spyOn(ContextService, 'getImageSaveDestination').and.returnValue(
          AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
        spyOn(
          ImageUploadHelperService,
          'convertImageDataToImageFile').and.returnValue(imageFile);
        $scope.save();
        $scope.$apply();
        expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
        expect($uibModalInstance.close).toHaveBeenCalledWith({
          math_content: {
            raw_latex: 'x^2',
            svg_filename: 'mathImage.svg'
          }
        });
      });
  });

  describe('when the editor is Link editor', function() {
    var ContextService = null;
    const customizationArgSpecs = [{
      name: 'url',
      default_value: 'google.com'
    }, {
      name: 'text',
      default_value: ''
    }];

    beforeEach(angular.mock.module('oppia'));

    beforeEach(angular.mock.module('oppia', function($provide) {
      mockExternalRteSaveEventEmitter = new EventEmitter();
      $provide.value('ExternalRteSaveService', {
        onExternalRteSave: mockExternalRteSaveEventEmitter
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $controller) {
      $timeout = $injector.get('$timeout');
      var $rootScope = $injector.get('$rootScope');
      ContextService = $injector.get('ContextService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller(
        'RteHelperModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          attrsCustomizationArgsDict: {
            url: 'google.com',
            text: ''
          },
          customizationArgSpecs: customizationArgSpecs,
        });
    }));

    it('should load modal correctly', function() {
      expect($scope.customizationArgSpecs).toEqual(customizationArgSpecs);
      expect($scope.currentRteIsLinkEditor).toBeTrue();
    });

    it('should not disable save button when not in link editor', function() {
      $scope.currentRteIsLinkEditor = false;

      expect($scope.disableSaveButtonForLinkRte()).toBeFalse();
    });

    it('should disable save button when text may be misleading', function() {
      const URLs = ['malicious.com', 'www.malicious.com',
        'https://malicious.com', 'https://www.malicious.com'];
      const texts = ['google.com', 'friendly.org', 'https://www.happy.gov'];

      for (const URL of URLs) {
        for (const text of texts) {
          $scope.tmpCustomizationArgs = [{
            name: 'url',
            value: URL
          }, {
            name: 'text',
            value: text
          }];

          expect($scope.disableSaveButtonForLinkRte()).toBeTrue();
        }
      }
    });

    it('should enable save button when text matches url', function() {
      $scope.tmpCustomizationArgs = [{
        name: 'url',
        value: 'www.google.com'
      }, {
        name: 'text',
        value: 'https://google.com'
      }];

      expect($scope.disableSaveButtonForLinkRte()).toBeFalse();
    });

    it('should enable save button when text is not a URL', function() {
      $scope.tmpCustomizationArgs = [{
        name: 'url',
        value: 'www.google.com'
      }, {
        name: 'text',
        value: 'click here'
      }];

      expect($scope.disableSaveButtonForLinkRte()).toBeFalse();
    });

    it('should save modal customization args when closing it', function() {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(ContextService, 'getEntityType').and.returnValue('exploration');

      expect($scope.disableSaveButtonForLinkRte()).toBe(false);

      $scope.save();

      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect($uibModalInstance.close).toHaveBeenCalledWith({
        url: 'google.com',
        text: 'google.com'
      });
    });
  });

  describe('when customization args doesn\'t have a valid youtube video',
    function() {
      var ContextService = null;
      var customizationArgSpecs = [{
        name: 'heading',
        default_value: ''
      }, {
        name: 'video_id',
        default_value: 'https://www.youtube.com'
      }];

      beforeEach(angular.mock.module('oppia'));

      beforeEach(angular.mock.module('oppia', function($provide) {
        mockExternalRteSaveEventEmitter = new EventEmitter();
        $provide.value('ExternalRteSaveService', {
          onExternalRteSave: mockExternalRteSaveEventEmitter
        });
      }));

      beforeEach(angular.mock.inject(function($injector, $controller) {
        $timeout = $injector.get('$timeout');
        var $rootScope = $injector.get('$rootScope');
        ContextService = $injector.get('ContextService');

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
        expect($uibModalInstance.dismiss).toHaveBeenCalledWith(false);
      });

      it('should save modal customization args when closing it', function() {
        spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
        spyOn(ContextService, 'getEntityType').and.returnValue('exploration');

        $scope.save();

        expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
        expect($uibModalInstance.close).toHaveBeenCalledWith({
          heading: {},
          video_id: 'https://www.youtube.com'
        });
      });
    });

  describe('when cancel is clicked with default customization args', () => {
    var customizationArgSpecs = [{
      name: 'filepath',
      default_value: ''
    }, {
      name: 'caption',
      default_value: ''
    }, {
      name: 'alt',
      default_value: ''
    }];

    beforeEach(angular.mock.module('oppia'));

    beforeEach(angular.mock.module('oppia', function($provide) {
      mockExternalRteSaveEventEmitter = new EventEmitter();
      $provide.value('ExternalRteSaveService', {
        onExternalRteSave: mockExternalRteSaveEventEmitter
      });
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
            alt: '',
            caption: '',
            filepath: ''
          },
          customizationArgSpecs: customizationArgSpecs,
        });
    }));

    it('should detect whether the default RTE component is used', ()=>{
      expect($scope.defaultRTEComponent).toBeTrue();
    });

    it('should close modal and remove the tag', function() {
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith(true);
    });
  });

  describe('when delete is clicked', () => {
    var customizationArgSpecs = [{
      name: 'filepath',
      default_value: ''
    }, {
      name: 'caption',
      default_value: ''
    }, {
      name: 'alt',
      default_value: ''
    }];

    beforeEach(angular.mock.module('oppia'));

    beforeEach(angular.mock.module('oppia', function($provide) {
      mockExternalRteSaveEventEmitter = new EventEmitter();
      $provide.value('ExternalRteSaveService', {
        onExternalRteSave: mockExternalRteSaveEventEmitter
      });
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
            alt: '',
            caption: '',
            filepath: ''
          },
          customizationArgSpecs: customizationArgSpecs,
        });
    }));

    it('should delete the RTE component', ()=>{
      $scope.delete();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith(true);
    });
  });
});
