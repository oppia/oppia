// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit test for Story Creation Service.
 */

import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { CsrfTokenService } from 'services/csrf-token.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Story Creation Service', () => {
  let $rootScope = null;
  let $scope = null;
  let StoryCreationService = null;
  let TopicEditorStateService = null;
  let ImageLocalStorageService = null;
  let LocalStorageService = null;
  let CsrfTokenService: CsrfTokenService;
  let $uibModal = null;
  let $httpBackend = null;
  let $q = null;
  let imageBlob = null;
  let mockWindow = {
    location: ''
  };

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    StoryCreationService = $injector.get('StoryCreationService');
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    ImageLocalStorageService = $injector.get('ImageLocalStorageService');
    LocalStorageService = $injector.get('LocalStorageService');
    CsrfTokenService = $injector.get('CsrfTokenService');

    imageBlob = new Blob(['image data'], {type: 'imagetype'});

    spyOn(ImageLocalStorageService, 'getStoredImagesData').and.returnValue(
      [{
        filename: 'Image1',
        imageBlob: imageBlob
      }]);
    spyOn(ImageLocalStorageService, 'getThumbnailBgColor').and.returnValue(
      '#f00');
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue({
      getId: () => 'id'
    });
    spyOn(CsrfTokenService, 'getTokenAsync')
      .and.returnValue($q.resolve('sample-csrf-token'));
  }));

  it('should not initiate new story creation if another is in process', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        isValid: () => true,
        title: 'Title',
        description: 'Description',
        urlFragment: 'url'
      })
    });

    StoryCreationService.createNewCanonicalStory();
    $scope.$apply();

    // Creating a new story while previous was in creation process.
    expect(StoryCreationService.createNewCanonicalStory()).toBe(undefined);
  });

  it('should post story data to server and change window location' +
    ' on success', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        isValid: () => true,
        title: 'Title',
        description: 'Description',
        urlFragment: 'url'
      })
    });

    $httpBackend.expectPOST('/topic_editor_story_handler/id')
      .respond(200, {storyId: 'id'});

    expect(mockWindow.location).toBe('');


    StoryCreationService.createNewCanonicalStory();
    $scope.$apply();

    $httpBackend.flush();

    expect(mockWindow.location).toBe('/story_editor/id');
  });

  it('should throw error if the newly created story is not valid', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        isValid: () => false,
        title: 'Title',
        description: 'Description',
        urlFragment: 'url'
      })
    });
    try {
      StoryCreationService.createNewCanonicalStory();
      $scope.$apply();
    } catch (e) {
      expect(e).toBe(new Error('Story fields cannot be empty'));
    }
  });

  it('should increment topic version in local storage when a new story ' +
  'successfully created', () => {
    const topicEditorBrowserTabsInfo = (
      EntityEditorBrowserTabsInfo.create('topic', 'id', 2, 2, false));
    spyOn(
      LocalStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(topicEditorBrowserTabsInfo);
    spyOn(
      LocalStorageService, 'updateEntityEditorBrowserTabsInfo'
    ).and.callFake(() => {});
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        isValid: () => true,
        title: 'Title',
        description: 'Description',
        urlFragment: 'url'
      })
    });

    $httpBackend.expectPOST('/topic_editor_story_handler/id')
      .respond(200, {storyId: 'id'});
    expect(topicEditorBrowserTabsInfo.getLatestVersion()).toEqual(2);

    StoryCreationService.createNewCanonicalStory();
    $scope.$apply();
    $httpBackend.flush();

    expect(topicEditorBrowserTabsInfo.getLatestVersion()).toEqual(3);
  });
});
