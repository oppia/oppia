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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {
  NgbModal,
  NgbModalModule,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {TopicCreationBackendApiService} from 'domain/topic/topic-creation-backend-api.service';
import {NewlyCreatedTopic} from 'domain/topics_and_skills_dashboard/newly-created-topic.model';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AlertsService} from 'services/alerts.service';
import {ContextService} from 'services/context.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {TopicCreationService} from './topic-creation.service';

describe('Topic creation service', () => {
  let topicCreationService: TopicCreationService;
  let contextService: ContextService;
  let ngbModal: NgbModal;
  let alertsService: AlertsService;
  let imageLocalStorageService: ImageLocalStorageService;
  let topicCreationBackendApiService: TopicCreationBackendApiService;
  let topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService;
  let urlInterpolationService: UrlInterpolationService;

  class MockWindowRef {
    nativeWindow = {
      open: () => {
        return {
          close: () => {},
          location: {
            href: '',
          },
        };
      },
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModalModule],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        AlertsService,
        ContextService,
        ImageLocalStorageService,
        TopicCreationBackendApiService,
        TopicsAndSkillsDashboardBackendApiService,
        UrlInterpolationService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    topicCreationService = TestBed.inject(TopicCreationService);
    contextService = TestBed.inject(ContextService);
    ngbModal = TestBed.inject(NgbModal);
    alertsService = TestBed.inject(AlertsService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    topicCreationBackendApiService = TestBed.inject(
      TopicCreationBackendApiService
    );
    topicsAndSkillsDashboardBackendApiService = TestBed.inject(
      TopicsAndSkillsDashboardBackendApiService
    );
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
  });

  it('should create new topic', fakeAsync(() => {
    topicCreationService.topicCreationInProgress = false;
    spyOn(contextService, 'setImageSaveDestinationToLocalStorage');
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve(
        new NewlyCreatedTopic('valid', 'valid', 'valid', 'valid')
      ),
    } as NgbModalRef);
    spyOn(alertsService, 'clearWarnings');
    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue([]);
    spyOn(imageLocalStorageService, 'getThumbnailBgColor').and.returnValue(
      'bgColor'
    );
    spyOn(imageLocalStorageService, 'flushStoredImagesData');
    spyOn(topicCreationBackendApiService, 'createTopicAsync').and.returnValue(
      Promise.resolve({topicId: 'topicId'})
    );
    spyOn(
      topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized,
      'emit'
    );
    spyOn(contextService, 'resetImageSaveDestination');
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('');
    topicCreationService.createNewTopic();
    tick();
    tick();
    expect(
      contextService.setImageSaveDestinationToLocalStorage
    ).toHaveBeenCalled();
    expect(ngbModal.open).toHaveBeenCalled();
    expect(alertsService.clearWarnings).toHaveBeenCalled();
    expect(imageLocalStorageService.getStoredImagesData).toHaveBeenCalled();
    expect(imageLocalStorageService.getThumbnailBgColor).toHaveBeenCalled();
    expect(imageLocalStorageService.flushStoredImagesData).toHaveBeenCalled();
    expect(topicCreationBackendApiService.createTopicAsync).toHaveBeenCalled();
    expect(contextService.resetImageSaveDestination).toHaveBeenCalled();
    expect(urlInterpolationService.interpolateUrl).toHaveBeenCalled();
  }));

  it('should not create topic if creation is already in process', () => {
    topicCreationService.topicCreationInProgress = true;
    spyOn(contextService, 'setImageSaveDestinationToLocalStorage');
    topicCreationService.createNewTopic();
    expect(
      contextService.setImageSaveDestinationToLocalStorage
    ).not.toHaveBeenCalled();
  });

  it('should throw error if topic fields are empty', fakeAsync(() => {
    topicCreationService.topicCreationInProgress = false;
    spyOn(contextService, 'setImageSaveDestinationToLocalStorage');
    spyOn(ngbModal, 'open').and.returnValue({
      result: {
        then: (successCallback: (arg1: {}) => void, errorCallback) => {
          successCallback({
            isValid: () => {
              return false;
            },
          });
        },
      },
    } as NgbModalRef);
    expect(() => {
      topicCreationService.createNewTopic();
      tick();
    }).toThrowError('Topic fields cannot be empty');
    expect(
      contextService.setImageSaveDestinationToLocalStorage
    ).toHaveBeenCalled();
    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should throw error if new topic is invalid', fakeAsync(() => {
    topicCreationService.topicCreationInProgress = false;
    spyOn(contextService, 'setImageSaveDestinationToLocalStorage');
    spyOn(ngbModal, 'open').and.returnValue({
      result: {
        then: (successCallback: (arg1: {}) => void, errorCallback) => {
          successCallback({
            isValid: () => {
              return true;
            },
          });
        },
      },
    } as NgbModalRef);
    spyOn(imageLocalStorageService, 'getThumbnailBgColor').and.returnValue(
      null
    );
    expect(() => {
      topicCreationService.createNewTopic();
      tick();
    }).toThrowError('Background color not found.');
  }));

  it('should handle error if topic creation fails', fakeAsync(() => {
    let error = 'promise rejected';
    topicCreationService.topicCreationInProgress = false;
    spyOn(contextService, 'setImageSaveDestinationToLocalStorage');
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve(
        new NewlyCreatedTopic('valid', 'valid', 'valid', 'valid')
      ),
    } as NgbModalRef);
    spyOn(alertsService, 'clearWarnings');
    spyOn(alertsService, 'addWarning');
    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue([]);
    spyOn(imageLocalStorageService, 'getThumbnailBgColor').and.returnValue(
      'bgColor'
    );
    spyOn(imageLocalStorageService, 'flushStoredImagesData');
    spyOn(topicCreationBackendApiService, 'createTopicAsync').and.returnValue(
      Promise.reject({error})
    );
    topicCreationService.createNewTopic();
    tick();
    tick();
    expect(topicCreationService.topicCreationInProgress).toBeFalse();
    expect(alertsService.addWarning).toHaveBeenCalledWith(error);
  }));

  it('should do nothing when user cancels the topic creation modal', fakeAsync(() => {
    topicCreationService.topicCreationInProgress = false;
    spyOn(contextService, 'setImageSaveDestinationToLocalStorage');
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);
    spyOn(alertsService, 'clearWarnings');
    topicCreationService.createNewTopic();
    tick();
    expect(
      contextService.setImageSaveDestinationToLocalStorage
    ).toHaveBeenCalled();
    expect(ngbModal.open).toHaveBeenCalled();
  }));
});
