// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EndExploration component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { importAllAngularServices } from 'tests/unit-test-utils';

describe('EndExplorationValidationService', function() {
  let ctrl;
  let $httpBackend;
  let $q;
  let $rootScope;
  let $scope;
  let ContextService;
  let ReadOnlyCollectionBackendApiService;
  let UrlService;

  const httpResponse = {
    summaries: [{
      id: '0'
    }]
  };
  const editorTabContext = 'preview';
  const pageContextEditor = 'editor';
  const sampleCollection = {
    collection: {
      id: '0',
      title: 'Collection Under Test',
      getTitle: function() {
        return 'Collection Under Test';
      }
    }
  };

  let mockInteractionAttributesExtractorService = {
    getValuesFromAttributes: function(interactionId, attrs) {
      return attrs;
    }
  };

  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();

  describe('Valid exploration id provided', function() {
    const explorationIds = ['0'];
    const requestUrl = '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds));

    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value(
        'InteractionAttributesExtractorService',
        mockInteractionAttributesExtractorService);
      $provide.value('$attrs', {
        recommendedExplorationIds: explorationIds
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      ContextService = $injector.get('ContextService');
      ReadOnlyCollectionBackendApiService =
        $injector.get('ReadOnlyCollectionBackendApiService');
      $httpBackend = $injector.get('$httpBackend');
      UrlService = $injector.get('UrlService');

      ctrl = $componentController('oppiaInteractiveEndExploration');

      spyOn(ContextService, 'getPageContext').and
        .returnValue(pageContextEditor);
      spyOn(ContextService, 'getEditorTabContext').and.
        returnValue(editorTabContext);
      spyOn(ReadOnlyCollectionBackendApiService, 'loadCollectionAsync')
        .and.callFake(function() {
          var deferred = $q.defer();
          deferred.resolve(sampleCollection.collection);
          return deferred.promise;
        });
      spyOn(UrlService, 'getCollectionIdFromExplorationUrl')
        .and.returnValue('0');
      spyOn(UrlService, 'isIframed').and.returnValue(true);

      $httpBackend.expectGET(requestUrl).respond(httpResponse);
      ctrl.$onInit();
      $httpBackend.flush();
      $scope.$apply();
    }));

    it('should initialize ctrl variables', function() {
      expect(ctrl.isIframed).toBe(true);
      expect(ctrl.isInEditorPage).toBe(true);
      expect(ctrl.isInEditorPreviewMode).toBe(true);
      expect(ctrl.isInEditorMainTab).toBe(false);
      expect(ctrl.collectionId).toBe('0');
      expect(ctrl.getCollectionTitle()).toBe('Collection Under Test');
      expect(ctrl.errorMessage).toBe('');
    });

    it('should not display error message', function() {
      expect(ctrl.isInEditorPage).toBe(true);
      expect(ctrl.isInEditorPreviewMode).toBe(true);
      expect(ctrl.errorMessage).toBe('');
    });
  });

  describe('Invalid exploration Id provided', function() {
    const explorationIds = ['0', '1'];
    const requestUrl = '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds));

    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value(
        'InteractionAttributesExtractorService',
        mockInteractionAttributesExtractorService);
      $provide.value('$attrs', {
        recommendedExplorationIds: explorationIds
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      ContextService = $injector.get('ContextService');
      ReadOnlyCollectionBackendApiService =
        $injector.get('ReadOnlyCollectionBackendApiService');
      $httpBackend = $injector.get('$httpBackend');
      UrlService = $injector.get('UrlService');

      ctrl = $componentController('oppiaInteractiveEndExploration');

      spyOn(ContextService, 'getPageContext').and
        .returnValue(pageContextEditor);
      spyOn(ContextService, 'getEditorTabContext').and.
        returnValue(editorTabContext);
      spyOn(ReadOnlyCollectionBackendApiService, 'loadCollectionAsync')
        .and.callFake(function() {
          var deferred = $q.defer();
          deferred.resolve(sampleCollection.collection);
          return deferred.promise;
        });
      spyOn(UrlService, 'getCollectionIdFromExplorationUrl')
        .and.returnValue('0');
      spyOn(UrlService, 'isIframed').and.returnValue(true);

      $httpBackend.expectGET(requestUrl).respond(httpResponse);
      ctrl.$onInit();
      $httpBackend.flush();
      $scope.$apply();
    }));

    it('should display error message', function() {
      expect(ctrl.isIframed).toBe(true);
      expect(ctrl.isInEditorPage).toBe(true);
      expect(ctrl.isInEditorPreviewMode).toBe(true);
      expect(ctrl.isInEditorMainTab).toBe(false);
      expect(ctrl.collectionId).toBe('0');
      expect(ctrl.getCollectionTitle()).toBe('Collection Under Test');
      expect(ctrl.errorMessage).toBe(
        'Warning: exploration(s) with the IDs "' + '1' +
      '" will not be shown as recommendations because ' +
      'they either do not exist, or are not publicly viewable.');
    });
  });

  describe('Data should not be fetched from backend ', function() {
    const explorationIds = ['0', '1'];

    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value(
        'InteractionAttributesExtractorService',
        mockInteractionAttributesExtractorService);
      $provide.value('$attrs', {
        recommendedExplorationIds: explorationIds
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      ContextService = $injector.get('ContextService');
      ReadOnlyCollectionBackendApiService =
        $injector.get('ReadOnlyCollectionBackendApiService');
      $httpBackend = $injector.get('$httpBackend');
      UrlService = $injector.get('UrlService');

      ctrl = $componentController('oppiaInteractiveEndExploration');

      spyOn(ContextService, 'getPageContext').and
        .returnValue('learner');
      spyOn(ContextService, 'getEditorTabContext').and.
        returnValue(editorTabContext);
      spyOn(ReadOnlyCollectionBackendApiService, 'loadCollectionAsync')
        .and.callFake(function() {
          var deferred = $q.defer();
          deferred.resolve(sampleCollection.collection);
          return deferred.promise;
        });
      spyOn(UrlService, 'getCollectionIdFromExplorationUrl')
        .and.returnValue('');
      spyOn(UrlService, 'isIframed').and.returnValue(true);
      ctrl.$onInit();
      $scope.$apply();
    }));

    it('should not load collection data', function() {
      expect(ctrl.collectionId).toBe('');
      expect(ReadOnlyCollectionBackendApiService.loadCollectionAsync)
        .not.toHaveBeenCalled();
    });

    it('should not check if any author-recommended explorations are' +
    ' invalid.', function() {
      expect(ctrl.isInEditorPage).toBe(false);
      expect($httpBackend.flush).toThrowError();
      $httpBackend.verifyNoOutstandingRequest();
    });
  });
});
