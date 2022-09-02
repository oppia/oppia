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
 * @fileoverview Unit tests for facilitator dashboard page.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from
  '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LearnerGroupPagesConstants } from
  'pages/learner-group-pages/learner-group-pages.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'services/page-title.service';
import { FacilitatorDashboardPageComponent } from
  './facilitator-dashboard-page.component';
import { FacilitatorDashboardBackendApiService } from 'domain/learner_group/facilitator-dashboard-backend-api.service';
import { ShortLearnerGroupSummary } from 'domain/learner_group/short-learner-group-summary.model';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();

  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('FacilitatorDashboardPageComponent', () => {
  let component: FacilitatorDashboardPageComponent;
  let fixture: ComponentFixture<FacilitatorDashboardPageComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let translateService: TranslateService;
  let facilitatorDashboardBackendApiService:
    FacilitatorDashboardBackendApiService;
  let pageTitleService: PageTitleService;

  const shortSummaryBackendDict = {
    id: 'groupId1',
    title: 'group title',
    description: 'group description',
    facilitator_usernames: ['facilitator1'],
    learners_count: 4
  };
  const shortLearnerGroupSummary = (
    ShortLearnerGroupSummary.createFromBackendDict(
      shortSummaryBackendDict));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        FacilitatorDashboardPageComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    translateService = TestBed.inject(TranslateService);
    pageTitleService = TestBed.inject(PageTitleService);
    facilitatorDashboardBackendApiService = TestBed.inject(
      FacilitatorDashboardBackendApiService);
    fixture = TestBed.createComponent(FacilitatorDashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize', fakeAsync(() => {
    spyOn(component, 'subscribeToOnLangChange');
    spyOn(translateService.onLangChange, 'subscribe');
    spyOn(
      facilitatorDashboardBackendApiService,
      'fetchTeacherDashboardLearnerGroupsAsync'
    ).and.returnValue(Promise.resolve([shortLearnerGroupSummary]));

    component.ngOnInit();
    tick();

    expect(component.subscribeToOnLangChange).toHaveBeenCalled();
    expect(component.createLearnerGroupPageUrl).toBe(
      LearnerGroupPagesConstants.CREATE_LEARNER_GROUP_PAGE_URL);
    expect(component.shortLearnerGroupSummaries).toEqual(
      [shortLearnerGroupSummary]);
  }));

  it('should call set page title whenever the language is changed', () => {
    component.ngOnInit();
    spyOn(component, 'setPageTitle');

    translateService.onLangChange.emit();

    expect(component.setPageTitle).toHaveBeenCalled();
  });

  it('should set page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');

    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_FACILITATOR_DASHBOARD_PAGE_TITLE');
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_FACILITATOR_DASHBOARD_PAGE_TITLE');
  });

  it('should get learner group page url correctly', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/create-learner-group/groupId1');

    expect(component.getLearnerGroupPageUrl('groupId1')).toBe(
      '/create-learner-group/groupId1');
  });
});
