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
 * @fileoverview Unit tests for edit learner group page.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {LearnerGroupBackendApiService} from 'domain/learner_group/learner-group-backend-api.service';
import {LearnerGroupPagesConstants} from '../learner-group-pages.constants';
import {LearnerGroupData} from 'domain/learner_group/learner-group.model';
import {TranslateService} from '@ngx-translate/core';
import {PageTitleService} from 'services/page-title.service';
import {EditLearnerGroupPageComponent} from './edit-learner-group-page.component';
import {ContextService} from 'services/context.service';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();

  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('EditLearnerGroupPageComponent', () => {
  let component: EditLearnerGroupPageComponent;
  let fixture: ComponentFixture<EditLearnerGroupPageComponent>;
  let learnerGroupBackendApiService: LearnerGroupBackendApiService;
  let translateService: TranslateService;
  let contextService: ContextService;
  let pageTitleService: PageTitleService;

  const learnerGroupBackendDict = {
    id: 'groupId',
    title: 'title',
    description: 'description',
    facilitator_usernames: ['facilitator_username'],
    learner_usernames: ['username2'],
    invited_learner_usernames: ['username1'],
    subtopic_page_ids: ['subtopic_page_id'],
    story_ids: [],
  };
  const learnerGroup = LearnerGroupData.createFromBackendDict(
    learnerGroupBackendDict
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [EditLearnerGroupPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    learnerGroupBackendApiService = TestBed.inject(
      LearnerGroupBackendApiService
    );
    translateService = TestBed.inject(TranslateService);
    pageTitleService = TestBed.inject(PageTitleService);
    contextService = TestBed.inject(ContextService);
    fixture = TestBed.createComponent(EditLearnerGroupPageComponent);
    component = fixture.componentInstance;

    spyOn(contextService, 'getLearnerGroupId').and.returnValue('groupId');

    fixture.detectChanges();
  });

  it('should initialize', fakeAsync(() => {
    spyOn(
      learnerGroupBackendApiService,
      'fetchLearnerGroupInfoAsync'
    ).and.returnValue(Promise.resolve(learnerGroup));
    spyOn(component, 'subscribeToOnLangChange');
    spyOn(translateService.onLangChange, 'subscribe');

    component.ngOnInit();
    tick();

    expect(component.subscribeToOnLangChange).toHaveBeenCalled();
    expect(component.activeTab).toEqual(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_TABS.OVERVIEW
    );
    expect(component.learnerGroup).toEqual(learnerGroup);
    expect(component.getLearnersCount()).toBe(1);
  }));

  it('should call set page title whenever the language is changed', fakeAsync(() => {
    spyOn(
      learnerGroupBackendApiService,
      'fetchLearnerGroupInfoAsync'
    ).and.returnValue(Promise.resolve(learnerGroup));

    component.ngOnInit();
    tick();
    spyOn(component, 'setPageTitle');

    translateService.onLangChange.emit();

    expect(component.setPageTitle).toHaveBeenCalled();
  }));

  it('should set page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');

    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_EDIT_LEARNER_GROUP_PAGE_TITLE'
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_EDIT_LEARNER_GROUP_PAGE_TITLE'
    );
  });

  it('should set active tab and check if tab is active correctly', () => {
    component.setActiveTab(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_TABS.LEARNERS_PROGRESS
    );

    expect(component.activeTab).toEqual(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_TABS.LEARNERS_PROGRESS
    );

    let tabIsActive = component.isTabActive(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_TABS.LEARNERS_PROGRESS
    );
    expect(tabIsActive).toBeTrue();

    tabIsActive = component.isTabActive(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_TABS.OVERVIEW
    );
    expect(tabIsActive).toBeFalse();
  });
});
