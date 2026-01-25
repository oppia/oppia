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
import {WindowRef} from 'services/contextual/window-ref.service';
import {TopicCreationService} from './topic-creation.service';

describe('Topic creation service', () => {
  let topicCreationService: TopicCreationService;
  let ngbModal: NgbModal;
  let alertsService: AlertsService;
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
        TopicCreationBackendApiService,
        TopicsAndSkillsDashboardBackendApiService,
        UrlInterpolationService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    topicCreationService = TestBed.inject(TopicCreationService);
    ngbModal = TestBed.inject(NgbModal);
    alertsService = TestBed.inject(AlertsService);
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
    const mockImageData = {
      filename: 'test.svg',
      image_data: new Blob(),
      bg_color: '#000000',
    };
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve({
        topic: new NewlyCreatedTopic('valid', 'valid', 'valid', 'valid'),
        imageData: mockImageData,
      }),
    } as NgbModalRef);
    spyOn(alertsService, 'clearWarnings');
    spyOn(topicCreationBackendApiService, 'createTopicAsync').and.returnValue(
      Promise.resolve({topicId: 'topicId'})
    );
    spyOn(
      topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized,
      'emit'
    );
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('');
    topicCreationService.createNewTopic();
    tick();
    tick();
    expect(ngbModal.open).toHaveBeenCalled();
    expect(alertsService.clearWarnings).toHaveBeenCalled();
    expect(topicCreationBackendApiService.createTopicAsync).toHaveBeenCalled();
    expect(urlInterpolationService.interpolateUrl).toHaveBeenCalled();
  }));

  it('should not create topic if creation is already in process', () => {
    topicCreationService.topicCreationInProgress = true;
    spyOn(ngbModal, 'open');
    topicCreationService.createNewTopic();
    expect(ngbModal.open).not.toHaveBeenCalled();
  });

  it('should throw error if topic fields are empty', fakeAsync(() => {
    topicCreationService.topicCreationInProgress = false;
    const mockImageData = {
      filename: 'test.svg',
      image_data: new Blob(),
      bg_color: '#000000',
    };
    const mockTopic = {
      isValid: () => false,
    };
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve({
        topic: mockTopic,
        imageData: mockImageData,
      }),
    } as NgbModalRef);
    expect(() => {
      topicCreationService.createNewTopic();
      tick();
    }).toThrowError('Topic fields cannot be empty');
    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should throw error if image data is missing', fakeAsync(() => {
    topicCreationService.topicCreationInProgress = false;
    const mockTopic = {
      isValid: () => true,
    };
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve({
        topic: mockTopic,
        imageData: null,
      }),
    } as NgbModalRef);
    expect(() => {
      topicCreationService.createNewTopic();
      tick();
    }).toThrowError('Image data is required');
  }));

  it('should handle error if topic creation fails', fakeAsync(() => {
    let error = 'promise rejected';
    topicCreationService.topicCreationInProgress = false;
    const mockImageData = {
      filename: 'test.svg',
      image_data: new Blob(),
      bg_color: '#000000',
    };
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve({
        topic: new NewlyCreatedTopic('valid', 'valid', 'valid', 'valid'),
        imageData: mockImageData,
      }),
    } as NgbModalRef);
    spyOn(alertsService, 'clearWarnings');
    spyOn(alertsService, 'addWarning');
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
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);
    spyOn(alertsService, 'clearWarnings');
    topicCreationService.createNewTopic();
    tick();
    expect(ngbModal.open).toHaveBeenCalled();
  }));
});
