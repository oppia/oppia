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
 * @fileoverview Unit tests for EditThumbnailModalController.
 */

import { waitForAsync } from '@angular/core/testing';
import { importAllAngularServices } from 'tests/unit-test-utils';
describe('Edit Thumbnail Modal Controller', function() {
  let $q = null;
  let $scope = null;
  let $timeout = null;
  let $uibModalInstance = null;

  const allowedBgColors = true;
  const aspectRatio = '';
  const dimensions = {};
  const getPreviewDescription = () => {};
  const getPreviewDescriptionBgColor = () => {};
  const getPreviewFooter = () => {};
  const getPreviewTitle = () => {};
  const openInUploadMode = true;
  const tempBgColor = '';
  const uploadedImage = new File([], 'uploaded.png');
  const uploadedImageMimeType = 'image/svg+xml';

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    $q = $injector.get('$q');
    const $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss'], {
        rendered: $q.resolve()
      });

    $scope = $rootScope.$new();
    $controller('EditThumbnailModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      allowedBgColors: allowedBgColors,
      aspectRatio: aspectRatio,
      dimensions: dimensions,
      getPreviewDescription: getPreviewDescription,
      getPreviewDescriptionBgColor: getPreviewDescriptionBgColor,
      getPreviewFooter: getPreviewFooter,
      getPreviewTitle: getPreviewTitle,
      openInUploadMode: openInUploadMode,
      tempBgColor: tempBgColor,
      uploadedImage: uploadedImage,
      uploadedImageMimeType: uploadedImageMimeType
    });
  }));

  it('should set background color when modal is rendered', function() {
    spyOn($scope, 'updateBackgroundColor').and.callThrough();
    $scope.$apply();

    expect($scope.updateBackgroundColor).toHaveBeenCalled();
  });

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.uploadedImage).toBe(uploadedImage);
      expect($scope.invalidImageWarningIsShown).toBe(false);
      expect($scope.allowedBgColors).toBe(allowedBgColors);
      expect($scope.aspectRatio).toBe(aspectRatio);
      expect($scope.getPreviewDescription).toEqual(getPreviewDescription);
      expect($scope.getPreviewDescriptionBgColor).toEqual(
        getPreviewDescriptionBgColor);
      expect($scope.getPreviewFooter).toEqual(
        getPreviewFooter);
      expect($scope.getPreviewTitle).toEqual(getPreviewTitle);
    });

  it('should load a image file in onchange event and save it if it\'s a' +
    ' svg file', function(done) {
    // This spy is to be sure that an image element will be returned from
    // document.querySelector method.
    spyOn(document, 'querySelector').and.callFake(function() {
      return document.createElement('img');
    });

    // This is just a mocked base 64 in order to test the FileReader event
    // and its result property.
    const dataBase64Mock = 'PHN2ZyB4bWxucz0iaHR0cDo';
    const arrayBuffer = Uint8Array.from(
      window.atob(dataBase64Mock), c => c.charCodeAt(0));
    const file = new File([arrayBuffer], 'thumbnail.png', {
      type: 'image/svg+xml'
    });

    // Mocking JQuery element method.
    const element = $(document.createElement('div'));
    spyOn(window, '$').withArgs('.oppia-thumbnail-uploader').and.returnValue(
      element);

    // Spy Image constructor to handle its events.
    const image = document.createElement('img');
    spyOn(window, 'Image').and.returnValue(image);

    expect($scope.invalidImageWarningIsShown).toBe(false);
    $scope.onInvalidImageLoaded();

    expect($scope.invalidImageWarningIsShown).toBe(true);
    $scope.onFileChanged(file);

    // The setTimeout is being used here to not conflict with $timeout.flush
    // for fadeIn Jquery method. This first setTimeout is to wait the default
    // time for fadeOut Jquery method to complete, which is 400 miliseconds.
    // 1000ms is being used instead of 400ms just to be sure that fadeOut
    // callback is already executed.
    // Ref: https://api.jquery.com/fadeout/
    setTimeout(function() {
      $timeout.flush();
      done();
      // ---- Dispatch on load event ----
      image.dispatchEvent(new Event('load'));

      expect($scope.invalidTagsAndAttributes).toEqual({
        tags: ['html', 'body', 'parsererror', 'h3', 'div', 'h3'],
        attrs: []
      });
      expect($scope.uploadedImage).toBe(null);
      expect($scope.invalidImageWarningIsShown).toBe(false);

      // ---- Save information ----
      $scope.confirm();
      expect($uibModalInstance.close).toHaveBeenCalled();
    }, 1000);
  });

  it('should perform fadeIn and fadeOut operations correctly' +
    'after uploading thumbnail image', function() {
    // This is just a mocked base 64 in order to test the FileReader event
    // and its result property.
    const dataBase64Mock = 'PHN2ZyB4bWxucz0iaHR0cDo';
    const arrayBuffer = Uint8Array.from(
      window.atob(dataBase64Mock), c => c.charCodeAt(0));
    const file = new File([arrayBuffer], 'thumbnail.png', {
      type: 'image/svg+xml'
    });

    // Mocking JQuery element method.
    const element = $(document.createElement('div'));
    spyOn(window, '$').withArgs('.oppia-thumbnail-uploader').and.returnValue(
      element);
    const fadeInElementSpy = spyOn(element, 'fadeIn').and.callThrough();

    $scope.onFileChanged(file);

    waitForAsync(() => {
      expect(fadeInElementSpy).toHaveBeenCalled();
    });
  });

  it('should not load file if it is not a svg type', function() {
    expect($scope.invalidImageWarningIsShown).toBe(false);

    // This is just a mocked base 64 in order to test the FileReader event
    // and its result property.
    const dataBase64Mock = 'PHN2ZyB4bWxucz0iaHR0cDo';
    const arrayBuffer = Uint8Array.from(
      window.atob(dataBase64Mock), c => c.charCodeAt(0));
    const file = new File([arrayBuffer], 'thumbnail.png');

    $scope.onFileChanged(file);

    expect($scope.uploadedImage).toBe(null);
    expect($scope.invalidImageWarningIsShown).toBe(true);
  });

  it('should set updated background color on closing the modal', () => {
    $scope.bgColor = '#123456';
    $scope.confirm();
    expect($uibModalInstance.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ newBgColor: '#123456' })
    );
  });
});
