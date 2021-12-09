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

import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { StoryCreationService } from './story-creation.service';
import { AlertsService } from 'services/alerts.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { NewlyCreatedStory } from 'domain/topic/newly-created-story.model';
import { StoryCreationBackendApiService } from './story-creation-backend-api.service';

describe('Story Creation Service', () => {
  let storyCreationService: StoryCreationService;
  let ngbModal: NgbModal;
  let alertsService: AlertsService;
  let imageLocalStorageService: ImageLocalStorageService;
  let storyCreationBackendApiService: StoryCreationBackendApiService;
  let urlInterpolationService: UrlInterpolationService;

  class MockWindowRef {
    nativeWindow = {
      location: {
        hostname: 'local'
      }
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgbModalModule
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        AlertsService,
        ImageLocalStorageService,
        StoryCreationBackendApiService,
        UrlInterpolationService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    storyCreationService = TestBed.inject(StoryCreationService);
    ngbModal = TestBed.inject(NgbModal);
    alertsService = TestBed.inject(AlertsService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    storyCreationBackendApiService = TestBed.inject(
      StoryCreationBackendApiService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
  });

  it('should create a new story', fakeAsync(() => {
    storyCreationService.storyCreationInProgress = false;
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve(new NewlyCreatedStory('valid', 'valid', 'valid'))
    } as NgbModalRef);
    spyOn(alertsService, 'clearWarnings');
    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue([]);
    spyOn(imageLocalStorageService, 'getThumbnailBgColor').and.returnValue(
      'bgColor');
    spyOn(storyCreationBackendApiService, 'createStoryAsync').and.returnValue(
      Promise.resolve({ storyId: 'storyId' }));
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('');

    storyCreationService.createNewCanonicalStory();
    tick();
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(alertsService.clearWarnings).toHaveBeenCalled();
    expect(imageLocalStorageService.getStoredImagesData).toHaveBeenCalled();
    expect(imageLocalStorageService.getThumbnailBgColor).toHaveBeenCalled();
    expect(storyCreationBackendApiService.createStoryAsync).toHaveBeenCalled();
    expect(urlInterpolationService.interpolateUrl).toHaveBeenCalled();
  }));

  it('should not create story if creation is already in process', () => {
    storyCreationService.storyCreationInProgress = true;
    spyOn(imageLocalStorageService, 'getStoredImagesData');

    storyCreationService.createNewCanonicalStory();

    expect(imageLocalStorageService.getStoredImagesData)
      .not.toHaveBeenCalled();
  });

  it('should throw error if story fields are empty', fakeAsync(() => {
    storyCreationService.storyCreationInProgress = false;
    spyOn(ngbModal, 'open').and.returnValue({
      result: {
        then: (successCallback: (arg1) => void, errorCallback) => {
          successCallback({
            isValid: () => {
              return false;
            }
          });
        }
      }
    } as NgbModalRef);

    expect(() => {
      storyCreationService.createNewCanonicalStory();
      tick();
    }).toThrowError('Story fields cannot be empty');
    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should handle error if story creation fails', fakeAsync(() => {
    let error = 'promise rejected';
    storyCreationService.storyCreationInProgress = false;
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve(new NewlyCreatedStory('valid', 'valid', 'valid'))
    } as NgbModalRef);
    spyOn(alertsService, 'clearWarnings');
    spyOn(alertsService, 'addWarning');
    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue([]);
    spyOn(imageLocalStorageService, 'getThumbnailBgColor').and.returnValue(
      'bgColor');
    spyOn(imageLocalStorageService, 'flushStoredImagesData');
    spyOn(storyCreationBackendApiService, 'createStoryAsync').and.returnValue(
      Promise.reject({ error }));

    storyCreationService.createNewCanonicalStory();
    tick();
    tick();

    expect(storyCreationService.storyCreationInProgress).toBeFalse();
    expect(alertsService.addWarning).toHaveBeenCalledWith(error);
  }));

  it('should do nothing when user cancels the story creation modal',
    fakeAsync(() => {
      storyCreationService.storyCreationInProgress = false;
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.reject()
      } as NgbModalRef);
      spyOn(alertsService, 'clearWarnings');

      storyCreationService.createNewCanonicalStory();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
    }));
});
