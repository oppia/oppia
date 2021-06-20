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
 * @fileoverview Unit tests for EditProfilePictureModalController.
 */

import Cropper from 'cropperjs';

describe('EditProfilePictureModalController', function() {
  var $scope = null;
  var $timeout = null;
  var $uibModalInstance = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('EditProfilePictureModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.uploadedImage).toBe(null);
      expect($scope.croppedImageDataUrl).toBe('');
      expect($scope.invalidImageWarningIsShown).toBe(false);
    });

  it('should save new file and close the modal when file is changed',
    function(done) {
      spyOn(document, 'getElementById').and.callFake(function() {
        return document.createElement('img');
      });

      let dummyDiv = document.createElement('div');
      dummyDiv.className = 'oppia-profile-image-uploader';
      document.body.append(dummyDiv);

      // This is just a mock base 64 in order to test the FileReader event.
      var dataBase64Mock = 'VEhJUyBJUyBUSEUgQU5TV0VSCg==';
      const arrayBuffer = Uint8Array.from(
        window.atob(dataBase64Mock), c => c.charCodeAt(0));
      var file = new File([arrayBuffer], 'filename.mp3');


      $scope.onInvalidImageLoaded();

      expect($scope.uploadedImage).toBe(null);
      expect($scope.croppedImageDataUrl).toBe('');
      expect($scope.invalidImageWarningIsShown).toBe(true);

      $scope.onFileChanged(file);

      // Function setTimeout is being used here to not conflict with
      // $timeout.flush for fadeIn Jquery method. This first setTimeout is to
      // wait the default time for fadeOut Jquery method to complete, which is
      // 400 miliseconds. 800ms is being used instead of 400ms just to be sure
      // that fadeOut callbak is already executed.
      // Ref: https://api.jquery.com/fadeout/
      setTimeout(function() {
        $timeout.flush();

        expect($scope.invalidImageWarningIsShown).toBe(false);
        expect($scope.uploadedImage).toBe(
          'data:application/octet-stream;base64,' + dataBase64Mock);

        var mockUrl = 'mock-url';
        // This throws "Argument of type '{ toDataURL: () => string; }' is
        // not assignable to parameter of type 'HTMLCanvasElement'"". We need to
        // suppress this error because 'HTMLCanvasElement' has around 250 more
        // properties. We only need to define one for testing purposes.
        // @ts-expect-error
        spyOn(Cropper.prototype, 'getCroppedCanvas').and.returnValue({
          toDataURL: () => mockUrl
        });
        $scope.confirm();

        expect($scope.croppedImageDataUrl).toBe(mockUrl);
        expect($uibModalInstance.close).toHaveBeenCalledWith(mockUrl);
        document.body.removeChild(dummyDiv);
        done();
      }, 800);
    });
});
