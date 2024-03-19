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
 * @fileoverview Unit tests for CreateNewSkillModalService.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Rubric} from 'domain/skill/rubric.model';
import {SkillCreationBackendApiService} from 'domain/skill/skill-creation-backend-api.service';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AlertsService} from 'services/alerts.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {CreateNewSkillModalService} from './create-new-skill-modal.service';

describe('Create New Skill Modal Service', () => {
  let createNewSkillModalService: CreateNewSkillModalService;
  let alertsService: AlertsService;
  let imageLocalStorageService: ImageLocalStorageService;
  let topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService;
  let mockSkillCreationBackendApiService: MockSkillCreationBackendApiService;

  class MockNgbModal {
    open(content: string, options: string[]) {
      return {
        result: {
          then: (callb: (result: {}) => void) => {
            let result = {
              rubrics: {
                rubric1: {
                  toBackendDict: () => {},
                },
              },
            };
            callb(result);
          },
        },
      };
    }
  }

  class MockSkillCreationBackendApiService {
    throwError: boolean = false;
    message!: string;
    createSkillAsync(
      description: string,
      rubrics: Rubric[],
      explanation: string,
      topicsIds: string[],
      imagesData: ImageData[]
    ): object {
      return {
        then: (
          successCallback: (response: {skillId: string}) => void,
          errorCallback: (errorMessage: string) => void
        ) => {
          if (this.throwError) {
            errorCallback(this.message);
          } else {
            successCallback({
              skillId: 'test_id',
            });
          }
        },
      };
    }
  }

  class MockWindowRef {
    nativeWindow = {
      open: () => {
        return {
          location: {
            href: '',
          },
        };
      },
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: SkillCreationBackendApiService,
          useClass: MockSkillCreationBackendApiService,
        },
        CreateNewSkillModalService,
        AlertsService,
        UrlInterpolationService,
        TopicsAndSkillsDashboardBackendApiService,
        ImageLocalStorageService,
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    createNewSkillModalService = TestBed.inject(CreateNewSkillModalService);
    alertsService = TestBed.inject(AlertsService);
    alertsService = alertsService as jasmine.SpyObj<AlertsService>;
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    imageLocalStorageService =
      imageLocalStorageService as jasmine.SpyObj<ImageLocalStorageService>;
    topicsAndSkillsDashboardBackendApiService = TestBed.inject(
      TopicsAndSkillsDashboardBackendApiService
    );
    topicsAndSkillsDashboardBackendApiService =
      topicsAndSkillsDashboardBackendApiService as jasmine.SpyObj<TopicsAndSkillsDashboardBackendApiService>;
    mockSkillCreationBackendApiService =
      // This throws "Type 'MockSkillCreationBackendApiService' is not
      // assignable to type desire". We need to suppress this error because of
      // the need to test validations. This happens because the
      // MockSkillCreationBackendApiService is a class and not an interface.
      // @ts-ignore
      TestBed.inject(
        SkillCreationBackendApiService
      ) as MockSkillCreationBackendApiService;
  });

  it('should not create new skill when skill creation is in progress', () => {
    spyOn(alertsService, 'clearWarnings');
    createNewSkillModalService.skillCreationInProgress = true;
    createNewSkillModalService.createNewSkill(['sadf']);
    expect(alertsService.clearWarnings).toHaveBeenCalledTimes(0);
  });

  it('should create new skill', fakeAsync(() => {
    spyOn(alertsService, 'clearWarnings');
    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue([]);
    spyOn(imageLocalStorageService, 'flushStoredImagesData');
    spyOn(
      topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized,
      'emit'
    );
    createNewSkillModalService.createNewSkill(['klsadlfj223']);
    tick(500);
    expect(createNewSkillModalService.skillCreationInProgress).toBeFalse();
    expect(alertsService.clearWarnings).toHaveBeenCalled();
    expect(
      topicsAndSkillsDashboardBackendApiService
        .onTopicsAndSkillsDashboardReinitialized.emit
    ).toHaveBeenCalledWith(true);
    expect(createNewSkillModalService.skillCreationInProgress).toBeFalse();
    expect(imageLocalStorageService.flushStoredImagesData).toHaveBeenCalled();
  }));

  it('should handle error when creating skill', () => {
    spyOn(alertsService, 'clearWarnings');
    spyOn(alertsService, 'addWarning');
    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue([]);
    mockSkillCreationBackendApiService.throwError = true;
    let message = 'error_message';
    mockSkillCreationBackendApiService.message = message;
    createNewSkillModalService.createNewSkill(['qwe']);
    expect(alertsService.addWarning).toHaveBeenCalledWith(message);
  });
});
