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
 * @fileoverview Unit tests for the Topic List Component.
 */

import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { NgbModalModule, NgbModalOptions, NgbModalRef, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { DeleteTopicModalComponent } from '../modals/delete-topic-modal.component';
import { TopicsListComponent } from './topics-list.component';

describe('Topics List Component', () => {
  let fixture: ComponentFixture<TopicsListComponent>;
  let componentInstance: TopicsListComponent;
  let urlInterpolationService: UrlInterpolationService;
  let alertsService: AlertsService;

  class MockEditabeleBackendApiService {
    deleteTopic(topicId: string): object {
      return {
        then: (
            successCallback: (status: number) => void,
            errorCallback: (error: string) => void
        ) => {
          successCallback(123);
        }
      };
    }
  }

  class MockTopicsAndSkillsDashboardBackendApiService {
    onTopicsAndSkillsDashboardReinitialized = {
      emit(): void {}
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbModalModule,
        NgbTooltipModule,
        HttpClientTestingModule,
        CommonModule,
        MatCardModule
      ],
      declarations: [
        TopicsListComponent,
        DeleteTopicModalComponent
      ],
      providers: [
        NgbModalRef,
        AlertsService,
        {
          provide: EditableTopicBackendApiService,
          useClass: MockEditabeleBackendApiService
        },
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService
        },
        UrlInterpolationService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicsListComponent);
    componentInstance = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlInterpolationService = (urlInterpolationService as unknown) as
      jasmine.SpyObj<UrlInterpolationService>;
    alertsService = TestBed.inject(AlertsService);
    alertsService = (alertsService as unknown) as
      jasmine.SpyObj<AlertsService>;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should destory correctly', () => {
    spyOn(componentInstance.directiveSubscriptions, 'unsubscribe');
    componentInstance.ngOnDestroy();
    expect(componentInstance.directiveSubscriptions.unsubscribe)
      .toHaveBeenCalled();
  });

  it('should get topic editor url', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and
      .returnValue('test_url');
    expect(componentInstance.getTopicEditorUrl('')).toEqual('test_url');
  });

  it('should show edit options', () => {
    componentInstance.selectedIndex = 'testIndex';
    expect(componentInstance.showEditOptions('testIndex')).toBeTrue();
    componentInstance.selectedIndex = '';
    expect(componentInstance.showEditOptions('testIndex')).toBeFalse();
  });

  it('should change edit options', () => {
    let topicId: string = 'testId';
    componentInstance.changeEditOptions(topicId);
    expect(componentInstance.selectedIndex).toEqual(topicId);
    componentInstance.selectedIndex = 'truth_string';
    componentInstance.changeEditOptions(topicId);
    expect(componentInstance.selectedIndex).toBeNull();
  });

  it('should get serial number for topic', () => {
    let pageNumber: number = 1;
    let itemsPerPage: number = 5;
    componentInstance.pageNumber = pageNumber;
    componentInstance.itemsPerPage = itemsPerPage;
    let topicIndex: number = 3;
    let expectedSerialNumber: number = topicIndex + 1 +
    (pageNumber * itemsPerPage);
    expect(componentInstance.getSerialNumberForTopic(topicIndex))
      .toEqual(expectedSerialNumber);
  });
});
