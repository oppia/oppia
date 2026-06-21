// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for for LearnerGroupsTabComponent.
 */

import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {LearnerGroupsTabComponent} from './learner-groups-tab.component';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ShortLearnerGroupSummary} from 'domain/learner_group/short-learner-group-summary.model';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {LearnerDashboardBackendApiService} from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import {LearnerGroupData} from 'domain/learner_group/learner-group.model';
import {LearnerGroupBackendApiService} from 'domain/learner_group/learner-group-backend-api.service';

describe('Learner groups tab Component', () => {
  let component: LearnerGroupsTabComponent;
  let fixture: ComponentFixture<LearnerGroupsTabComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let windowDimensionsService: WindowDimensionsService;
  let ngbModal: NgbModal;
  let learnerGroupBackendApiService: LearnerGroupBackendApiService;
  let learnerDashboardBackendApiService: LearnerDashboardBackendApiService;
  let mockResizeEmitter: EventEmitter<void>;

  const sampleShortLearnerGroupSummary = new ShortLearnerGroupSummary(
    'sampleId',
    'sampleTitle',
    'sampleDescription',
    ['username1'],
    2
  );
  const sampleLearnerGroupSummary = new LearnerGroupData(
    'sampleId',
    'sampleTitle',
    'sampleDescription',
    ['username1'],
    ['user1', 'user2'],
    [],
    ['subtopic1', 'subtopic2'],
    ['story1', 'story2']
  );

  beforeEach(async(() => {
    mockResizeEmitter = new EventEmitter();
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [MockTranslatePipe, LearnerGroupsTabComponent],
      providers: [
        UrlInterpolationService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => mockResizeEmitter,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerGroupsTabComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    learnerDashboardBackendApiService = TestBed.inject(
      LearnerDashboardBackendApiService
    );
    learnerGroupBackendApiService = TestBed.inject(
      LearnerGroupBackendApiService
    );
    ngbModal = TestBed.inject(NgbModal);

    component.username = 'username';
    fixture.detectChanges();
  });

  it('should initialize correctly', fakeAsync(() => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOn(
      learnerDashboardBackendApiService,
      'fetchLearnerDashboardLearnerGroupsAsync'
    ).and.returnValue(
      Promise.resolve({
        learnerGroupsJoined: [sampleShortLearnerGroupSummary],
        invitedToLearnerGroups: [],
      })
    );

    component.ngOnInit();
    tick();

    expect(component.invitedToLearnerGroups).toEqual([]);
    expect(component.learnerGroupsJoined).toEqual([
      sampleShortLearnerGroupSummary,
    ]);
    expect(component.windowIsNarrow).toBe(false);
  }));

  it('should check whether window is narrow on resizing the screen', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    expect(component.windowIsNarrow).toBeTrue();

    mockResizeEmitter.emit();

    expect(component.windowIsNarrow).toBeFalse();
  });

  it('should switch the tab to Learner Groups', () => {
    const setActiveSection = spyOn(component.setActiveSection, 'emit');
    component.changeActiveSection();
    expect(setActiveSection).toHaveBeenCalled();
  });

  it('should get url of the learner group page', () => {
    const learnerGroupUrl = urlInterpolationService.interpolateUrl(
      '/learner-group/<groupId>',
      {
        groupId: 'groupId',
      }
    );
    expect(component.getLearnerGroupPageUrl('groupId')).toBe(learnerGroupUrl);
  });

  it('should decline learner group invitation successfully', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        learnerGroupTitle: 'sampleTitle',
      },
      result: Promise.resolve(),
    } as NgbModalRef);

    component.invitedToLearnerGroups = [sampleShortLearnerGroupSummary];

    component.declineLearnerGroupInvitation(sampleShortLearnerGroupSummary);
    tick();
    fixture.detectChanges();

    expect(component.invitedToLearnerGroups).toEqual([]);
  }));

  it('should accept learner group invitation successfully', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        learnerGroup: sampleShortLearnerGroupSummary,
      },
      result: Promise.resolve({
        progressSharingPermission: false,
      }),
    } as NgbModalRef);
    spyOn(
      learnerGroupBackendApiService,
      'updateLearnerGroupInviteAsync'
    ).and.returnValue(Promise.resolve(sampleLearnerGroupSummary));

    component.invitedToLearnerGroups = [sampleShortLearnerGroupSummary];
    component.learnerGroupsJoined = [];

    component.acceptLearnerGroupInvitation(sampleShortLearnerGroupSummary);
    tick();
    fixture.detectChanges();

    expect(component.invitedToLearnerGroups).toEqual([]);
    expect(component.learnerGroupsJoined).toEqual([
      sampleShortLearnerGroupSummary,
    ]);
  }));

  it('should view learner group details successfully', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        learnerGroup: sampleShortLearnerGroupSummary,
      },
      result: Promise.resolve(),
    } as NgbModalRef);

    component.viewLearnerGroupDetails(sampleShortLearnerGroupSummary);
    tick();
    fixture.detectChanges();
  }));
});
