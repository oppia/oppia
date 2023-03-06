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
 * @fileoverview Unit tests for Moderator Page Component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync }
  from '@angular/core/testing';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ThreadMessage, ThreadMessageBackendDict }
  from 'domain/feedback_message/ThreadMessage.model';
import { AlertsService } from 'services/alerts.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { LoaderService } from 'services/loader.service';
import { ModeratorPageComponent } from './moderator-page.component';
import { ActivityIdTypeDict, FeaturedActivityResponse,
  ModeratorPageBackendApiService, RecentCommitResponse, RecentFeedbackMessages }
  from './services/moderator-page-backend-api.service';

describe('Moderator Page Component', () => {
  let fixture: ComponentFixture<ModeratorPageComponent>;
  let componentInstance: ModeratorPageComponent;
  let loaderService: LoaderService;
  let datetimeFormatService: DateTimeFormatService;
  let alertsService: AlertsService;
  let threadMessageBackendDict: ThreadMessageBackendDict = {
    author_username: 'author',
    created_on_msecs: 123,
    entity_type: 'exploration',
    entity_id: 'id',
    message_id: 12312,
    text: 'test_txt',
    updated_status: 'stastu',
    updated_subject: 'asdf'
  };

  let message: ThreadMessage = ThreadMessage
    .createFromBackendDict(threadMessageBackendDict);

  let recentCommits: RecentCommitResponse = {
    results: [],
    cursor: 'str1',
    more: true,
    exp_ids_to_exp_data: [{
      category: 'test_category',
      title: 'test_title'
    }]
  };

  let recentFeedbackMessages: RecentFeedbackMessages = {
    results: [threadMessageBackendDict],
    cursor: 'test',
    more: true
  };

  let activityResponse: FeaturedActivityResponse = {
    featured_activity_references: []
  };

  class MockModeratorPageBackendApiService {
    getRecentCommitsAsync() {
      return {
        then: (
            successCallback: (response: RecentCommitResponse) => void
        ) => {
          successCallback(recentCommits);
        }
      };
    }

    getRecentFeedbackMessagesAsync() {
      return {
        then: (
            successCallback: (response: RecentFeedbackMessages) => void
        ) => {
          successCallback(recentFeedbackMessages);
        }
      };
    }

    getFeaturedActivityReferencesAsync() {
      return {
        then: (
            successCallback: (response: FeaturedActivityResponse) => void
        ) => {
          successCallback(activityResponse);
        }
      };
    }

    saveFeaturedActivityReferencesAsync(references: ActivityIdTypeDict[]) {
      return {
        then: (
            successCallback: () => void
        ) => {
          successCallback();
        }
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbNavModule
      ],
      declarations: [
        ModeratorPageComponent
      ],
      providers: [
        {
          provide: ModeratorPageBackendApiService,
          useClass: MockModeratorPageBackendApiService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModeratorPageComponent);
    componentInstance = fixture.componentInstance;
    loaderService = (TestBed.inject(LoaderService)) as
      jasmine.SpyObj<LoaderService>;
    datetimeFormatService = (
      TestBed.inject(DateTimeFormatService)) as
      jasmine.SpyObj<DateTimeFormatService>;
    alertsService = (
      TestBed.inject(AlertsService)) as
      jasmine.SpyObj<AlertsService>;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initiailze', fakeAsync(() => {
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    componentInstance.explorationData = [];
    componentInstance.ngOnInit();
    expect(componentInstance.explorationData)
      .toEqual(recentCommits.exp_ids_to_exp_data);
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(componentInstance.allCommits).toEqual(recentCommits.results);
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();

    expect(componentInstance.allFeedbackMessages)
      .toEqual(recentFeedbackMessages.results.map(
        d => ThreadMessage.createFromBackendDict(d))
      );

    expect(componentInstance.displayedFeaturedActivityReferences)
      .toEqual(activityResponse.featured_activity_references);
    expect(componentInstance.lastSavedFeaturedActivityReferences).toEqual(
      componentInstance.displayedFeaturedActivityReferences);
  }));

  it('should get date time as string', () => {
    let testDatetime: string = 'test_datetime';
    spyOn(datetimeFormatService, 'getLocaleAbbreviatedDatetimeString')
      .and.returnValue(testDatetime);
    expect(componentInstance.getDatetimeAsString(100)).toEqual(testDatetime);
  });

  it('should tell if message is from exploration', () => {
    expect(componentInstance.isMessageFromExploration(message)).toBeTrue();
    message.entityType = 'other_than_exploration';
    expect(componentInstance.isMessageFromExploration(message)).toBeFalse();
  });

  it('should get exploration create url', () => {
    expect(componentInstance.getExplorationCreateUrl('test'))
      .toEqual('/create/test');
  });

  it('should get activity create url', () => {
    let reference: ActivityIdTypeDict = {
      id: 'test_id',
      type: 'exploration'
    };
    expect(componentInstance.getActivityCreateUrl(reference))
      .toEqual('/create/' + reference.id);
    reference.type = 'not_exploration';
    expect(componentInstance.getActivityCreateUrl(reference))
      .toEqual('/create_collection/' + reference.id);
  });

  it('should tell if save featured activies button is disabled', () => {
    componentInstance.displayedFeaturedActivityReferences = componentInstance
      .lastSavedFeaturedActivityReferences;
    expect(componentInstance.isSaveFeaturedActivitiesButtonDisabled())
      .toBeTrue();
    componentInstance.displayedFeaturedActivityReferences = [];
    componentInstance.lastSavedFeaturedActivityReferences = [
      { id: 'not', type: 'equal' }];
    expect(componentInstance.isSaveFeaturedActivitiesButtonDisabled())
      .toBeFalse();
  });

  it('should save featured activity references', () => {
    spyOn(alertsService, 'clearWarnings');
    spyOn(alertsService, 'addSuccessMessage');
    componentInstance.saveFeaturedActivityReferences();
    expect(alertsService.clearWarnings).toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).toHaveBeenCalled();
  });

  it('should get schema', () => {
    expect(componentInstance.getSchema())
      .toEqual(componentInstance.FEATURED_ACTIVITY_REFERENCES_SCHEMA);
  });

  it('should update displayed featured activity references', () => {
    let newValue: ActivityIdTypeDict[] = [{
      id: 'test_id',
      type: 'exploration'
    }];
    componentInstance.displayedFeaturedActivityReferences = [];
    componentInstance.updateDisplayedFeaturedActivityReferences(newValue);
    expect(componentInstance.displayedFeaturedActivityReferences)
      .toEqual(newValue);
  });
});
