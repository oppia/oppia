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

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Story Creation Service', () => {
  let $rootScope = null;
  let StoryCreationService = null;
  let TopicEditorStateService = null;
  let ImageLocalStorageService = null;
  let $uibModal = null;
  let $q = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    StoryCreationService = $injector.get('StoryCreationService');
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    ImageLocalStorageService = $injector.get('ImageLocalStorageService');

    spyOn(ImageLocalStorageService, 'getStoredImagesData').and.returnValue(
      [{
        filename:'Image1',
        imageBlob: new Blob(['data:image/png;base64,xyz'], {type: 'image/png'})
      }]);
    spyOn(ImageLocalStorageService, 'getThumbnailBgColor').and.returnValue(
      '#f00');
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue({
      getId: () => 'id'
    });
  }));

  it('should not initiate new story creation if another is in process', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        isValid: () => true,
        title: 'Title',
        description: 'Description',
        story_url_fragment: 'url'
      })
    });

    StoryCreationService.createNewCanonicalStory();
    $rootScope.$apply();

    // Creating a new story while previous was in creation process.
    expect(StoryCreationService.createNewCanonicalStory()).toBe(undefined);
  });
});