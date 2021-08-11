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
 * @fileoverview Unit test for Topic Creation Service.
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Topic Creation Service', () => {
  let $rootScope = null;
  let TopicCreationService = null;
  let TopicEditorStateService = null;
  let ImageLocalStorageService = null;
  let TopicCreationBackendApiService = null;
  let UrlInterpolationService = null;
  let AlertsService = null;
  let $uibModal = null;
  let $q = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    TopicCreationService = $injector.get('TopicCreationService');
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    ImageLocalStorageService = $injector.get('ImageLocalStorageService');
    TopicCreationBackendApiService = $injector
      .get('TopicCreationBackendApiService');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    AlertsService = $injector.get('AlertsService');

    spyOn(ImageLocalStorageService, 'getStoredImagesData').and.returnValue(
      [{
        filename: 'Image1',
        imageBlob: new Blob(['data:image/png;base64,xyz'], {type: 'image/png'})
      }]);
    spyOn(ImageLocalStorageService, 'getThumbnailBgColor').and.returnValue(
      '#f00');
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue({
      getId: () => 'id'
    });
  }));

  it('should create topic when user clicks on create', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        isValid: () => true
      })
    });
    spyOn(TopicCreationBackendApiService, 'createTopicAsync')
      .and.returnValue($q.resolve({topicId: 'id'}));
    spyOn(UrlInterpolationService, 'interpolateUrl');

    TopicCreationService.createNewTopic();
    $rootScope.$apply();

    expect(UrlInterpolationService.interpolateUrl).toHaveBeenCalled();
  });

  it('should show alert message when topic creation fails', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        isValid: () => true
      })
    });
    spyOn(TopicCreationBackendApiService, 'createTopicAsync')
      .and.returnValue($q.reject({error: 'Topic creation failed'}));
    spyOn(AlertsService, 'addWarning');

    TopicCreationService.createNewTopic();
    $rootScope.$apply();

    expect(AlertsService.addWarning)
      .toHaveBeenCalledWith('Topic creation failed');
  });

  it('should not initiate new topic creation if another is in process', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        isValid: () => true
      })
    });

    TopicCreationService.createNewTopic();
    $rootScope.$apply();

    // Creating a new topic while previous was in creation process.
    expect(TopicCreationService.createNewTopic()).toBe(undefined);
  });

  it('should throw error if the newly created story is not valid', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        isValid: () => false
      })
    });

    try {
      TopicCreationService.createNewTopic();
      $rootScope.$apply();
    } catch (e) {
      expect(e).toBe(new Error('Topic fields cannot be empty'));
    }
  });
});
