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
 * @fileoverview Unit tests for TranslationModalController.
 */

describe('Translation Modal Controller', function() {
  let $httpBackend = null;
  let $q = null;
  let $scope = null;
  let $uibModalInstance = null;
  let CsrfTokenService = null;
  let TranslateTextService = null;
  let TranslationLanguageService = null;

  const opportunity = {
    id: '1',
    subheading: 'Subheading',
    heading: 'Heading'
  };
  const userIsLoggedIn = true;
  let getTextToTranslateSpy = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');
    const $rootScope = $injector.get('$rootScope');
    CsrfTokenService = $injector.get('CsrfTokenService');
    TranslateTextService = $injector.get('TranslateTextService');
    TranslationLanguageService = $injector.get('TranslationLanguageService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    spyOn(CsrfTokenService, 'getTokenAsync')
      .and.returnValue($q.resolve('sample-csrf-token'));

    spyOn(TranslationLanguageService, 'getActiveLanguageDescription').and
      .returnValue('English');
    spyOn(TranslationLanguageService, 'getActiveLanguageCode').and
      .returnValue('en');
    getTextToTranslateSpy = spyOn(TranslateTextService, 'getTextToTranslate');
    getTextToTranslateSpy.and.returnValue({
      text: 'Texto a traducir',
      more: true
    });

    $httpBackend.expect(
      'GET', '/gettranslatabletexthandler?exp_id=1&language_code=en')
      .respond({
        state_names_to_content_id_mapping: [{
          stateName1: ['1']
        }, {
          stateName2: ['2']
        }],
        version: 1
      });

    $scope = $rootScope.$new();
    $controller('TranslationModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      opportunity: opportunity,
      userIsLoggedIn: userIsLoggedIn
    });
  }));

  it('should initialize correctly $scope properties after controller' +
    ' initialization', function() {
    expect($scope.userIsLoggedIn).toBe(userIsLoggedIn);
    expect($scope.uploadingTranslation).toBe(false);
    expect($scope.activeWrittenTranslation).toEqual({
      html: ''
    });
    expect($scope.subheading).toBe('Subheading');
    expect($scope.heading).toBe('Heading');
    expect($scope.loadingData).toBe(true);
    expect($scope.moreAvailable).toBe(false);
    expect($scope.textToTranslate).toBe('');
    expect($scope.languageDescription).toBe('English');
    $httpBackend.flush();

    expect($scope.textToTranslate).toBe('Texto a traducir');
    expect($scope.moreAvailable).toBe(true);
    expect($scope.loadingData).toBe(false);
  });

  it('should get suggested text to translated again from backend when' +
    ' suggesting translated text', function() {
    $httpBackend.flush();
    expect($scope.textToTranslate).toBe('Texto a traducir');
    expect($scope.moreAvailable).toBe(true);
    expect($scope.loadingData).toBe(false);

    $httpBackend.expectPOST('/suggestionhandler/').respond(200);
    $scope.suggestTranslatedText();
    expect($scope.uploadingTranslation).toBe(true);
    getTextToTranslateSpy.and.returnValue({
      text: 'Texto a traducir 2',
      more: true
    });

    $httpBackend.flush();

    expect($scope.textToTranslate).toBe('Texto a traducir 2');
    expect($scope.moreAvailable).toBe(true);
    expect($scope.activeWrittenTranslation).toEqual({
      html: ''
    });
    expect($scope.uploadingTranslation).toBe(false);
  });

  it('should close modal when there is not more text to be translated',
    function() {
      $httpBackend.flush();

      getTextToTranslateSpy.and.returnValue({
        text: 'Texto a traducir 2',
        more: false
      });
      $scope.skipActiveTranslation();
      expect($scope.textToTranslate).toBe('Texto a traducir 2');
      expect($scope.moreAvailable).toBe(false);
      expect($scope.activeWrittenTranslation).toEqual({
        html: ''
      });

      $scope.suggestTranslatedText();
      expect($uibModalInstance.close).toHaveBeenCalled();
    });
});
