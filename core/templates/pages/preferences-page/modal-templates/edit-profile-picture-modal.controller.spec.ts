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

import $ from 'jquery';
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

  it('should init the variables', function() {
    expect($scope.uploadedImage).toBe(null);
    expect($scope.croppedImageDataUrl).toBe('');
    expect($scope.invalidImageWarningIsShown).toBe(false);
  });

  it('should get a file in onchange event and save it', function(done) {
    spyOn(document, 'getElementById').and.callFake(function() {
      return document.createElement('img');
    });

    var element = $(document.createElement('div'));

    // This is just a mock base 64 in order to test the FileReader event.
    var dataBase64Mock = 'VEhJUyBJUyBUSEUgQU5TV0VSCg==';
    const arrayBuffer = Uint8Array.from(
      window.atob(dataBase64Mock), c => c.charCodeAt(0));
    var file = new File([arrayBuffer], 'filename.mp3');

    // The window has strict type rules which will fail typescript lint tests
    // without the @ts-ignore.
    // @ts-ignore
    spyOn(window, '$').withArgs('.oppia-profile-image-uploader').and
      // @ts-ignore
      .returnValue(element);

    $scope.onInvalidImageLoaded();

    expect($scope.uploadedImage).toBe(null);
    expect($scope.croppedImageDataUrl).toBe('');
    expect($scope.invalidImageWarningIsShown).toBe(true);

    $scope.onFileChanged(file);

    // Function setTimeout is being used here to not conflict with
    // $timeout.flush for fadeIn Jquery method. This first setTimeout is to wait
    // the default time for fadeOut Jquery method to complete, which is 400
    // miliseconds. 800ms is being used instead of 400ms just to be sure that
    // fadeOut callbak is already executed.
    // Ref: https://api.jquery.com/fadeout/
    setTimeout(function() {
      $timeout.flush();
      done();

      expect($scope.invalidImageWarningIsShown).toBe(false);
      expect($scope.uploadedImage).toBe(
        'data:application/octet-stream;base64,' + dataBase64Mock);

      var mockUrl = 'mock-url';
      // @ts-ignore Cropper getCroppedCanvas method should return more
      // properties than toDataURL according with lint settings.
      spyOn(Cropper.prototype, 'getCroppedCanvas').and.returnValue({
        toDataURL: () => mockUrl
      });
      $scope.confirm();

      expect($scope.croppedImageDataUrl).toBe(mockUrl);
      expect($uibModalInstance.close).toHaveBeenCalledWith(mockUrl);
    }, 800);
  });
});
