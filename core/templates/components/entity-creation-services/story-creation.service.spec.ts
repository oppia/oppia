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

import { CsrfTokenService } from 'services/csrf-token.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { fakeAsync, tick } from '@angular/core/testing';
import { async } from 'q';
require('services/ngb-modal.service.ts');

fdescribe('Story Creation Service', () => {
  let $scope = null;
  let $rootScope = null;
  let StoryCreationService = null;
  let TopicEditorStateService = null;
  let ImageLocalStorageService = null;
  let CsrfTokenService: CsrfTokenService;
  let ngbModal: NgbModal = null;
  let $httpBackend = null;
  let $q = null;
  let imageBlob = null;
  let mockWindow = {
    location: ''
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    StoryCreationService = $injector.get('StoryCreationService');
    ngbModal = $injector.get('NgbModal');
    $q = $injector.get('$q');
    $httpBackend = $injector.get('$httpBackend');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    ImageLocalStorageService = $injector.get('ImageLocalStorageService');
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

  it('should not initiate new story creation if another is in process',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue(
      {
        result: Promise.resolve({
          isValid: () => true,
          title: 'Title',
          description: 'Description',
          urlFragment: 'url'
        })
      } as NgbModalRef
      );

      StoryCreationService.createNewCanonicalStory();
      tick();

      // Creating a new story while previous was in creation process.
      expect(StoryCreationService.createNewCanonicalStory()).toBe(undefined);
    })
  );

  it('should post story data to server and change window location' +
    ' on success', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: Promise.resolve({
          isValid: () => true,
          title: 'Title',
          description: 'Description',
          urlFragment: 'url'
        })
      } as NgbModalRef
    );

    $httpBackend.expectPOST('/topic_editor_story_handler/id')
      .respond(200, {storyId: 'id'});

    expect(mockWindow.location).toBe('');

    StoryCreationService.createNewCanonicalStory();
    tick();

    expect(mockWindow.location).toBe('/story_editor/id');
  }));

  it('should throw error if the newly created story is not valid',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue(
      {
        result: Promise.resolve({
          isValid: () => true,
          title: 'Title',
          description: 'Description',
          urlFragment: 'url'
        })
      } as NgbModalRef
      );
      try {
        StoryCreationService.createNewCanonicalStory();
        tick();
      } catch (e) {
        expect(e).toBe(new Error('Story fields cannot be empty'));
      }
    })
  );
});
