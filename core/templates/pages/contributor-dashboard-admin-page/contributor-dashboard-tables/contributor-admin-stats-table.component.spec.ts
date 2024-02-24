// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ContributorAdminStatsTable.
 */

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChanges } from '@angular/core';
import { CdAdminTranslationRoleEditorModal } from '../translation-role-editor-modal/cd-admin-translation-role-editor-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ContributorAdminStatsTable } from './contributor-admin-stats-table.component';
import { ContributorDashboardAdminStatsBackendApiService, QuestionReviewerStatsData, QuestionSubmitterStatsData, TranslationReviewerStatsData, TranslationSubmitterStatsData } from '../services/contributor-dashboard-admin-stats-backend-api.service';
import { ContributorDashboardAdminBackendApiService } from '../services/contributor-dashboard-admin-backend-api.service';
import { MatTableModule } from '@angular/material/table';
import { WindowRef } from 'services/contextual/window-ref.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CdAdminQuestionRoleEditorModal } from '../question-role-editor-modal/cd-admin-question-role-editor-modal.component';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';

describe('Contributor stats component', () => {
  let component: ContributorAdminStatsTable;
  let fixture: ComponentFixture<ContributorAdminStatsTable>;
  let $window: WindowRef;
  let contributorDashboardAdminStatsBackendApiService: (
    ContributorDashboardAdminStatsBackendApiService);
  let contributorDashboardAdminBackendApiService: (
    ContributorDashboardAdminBackendApiService);
  let ngbModal: NgbModal;
  class MockNgbModalRef {
    componentInstance!: {};
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatTableModule,
        MatTooltipModule
      ],
      declarations: [
        CdAdminTranslationRoleEditorModal,
        ContributorAdminStatsTable
      ],
      providers: [
        ContributorDashboardAdminStatsBackendApiService,
        ContributorDashboardAdminBackendApiService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          CdAdminTranslationRoleEditorModal]
      }
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ContributorAdminStatsTable);
    $window = TestBed.inject(WindowRef);
    component = fixture.componentInstance;

    contributorDashboardAdminStatsBackendApiService = TestBed.inject(
      ContributorDashboardAdminStatsBackendApiService);
    contributorDashboardAdminBackendApiService = TestBed.inject(
      ContributorDashboardAdminBackendApiService);
    ngbModal = TestBed.inject(NgbModal);

    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property innerWidth does not have access type get' error.
    // eslint-disable-next-line max-len
    // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
    // ref: https://github.com/jasmine/jasmine/issues/1415
    Object.defineProperty($window.nativeWindow, 'innerWidth', {
      get: () => undefined
    });

    component.ngOnInit();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  describe('when user navigates to contributor admin page on desktop', () => {
    beforeEach(waitForAsync(() => {
      spyOnProperty($window.nativeWindow, 'innerWidth').and.returnValue(900);
    }));
    it('should show translation submitter stats', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats')
        .and.returnValue(Promise.resolve({
          stats: [],
          nextOffset: 1,
          more: false,
        } as TranslationSubmitterStatsData));

      const changes: SimpleChanges = {
        activeTab: {
          currentValue: component.TAB_NAME_TRANSLATION_SUBMITTER,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.inputs.activeTab = component.TAB_NAME_TRANSLATION_SUBMITTER;
      component.ngOnChanges(changes);
      component.updateColumnsToDisplay();

      expect(component.columnsToDisplay).toEqual([
        'chevron',
        'contributorName',
        'recentPerformance',
        'overallAccuracy',
        'submittedTranslationsCount',
        'lastContributedInDays',
        'role'
      ]);
    }));

    it('should show translation reviewer stats', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats')
        .and.returnValue(Promise.resolve({
          stats: [],
          nextOffset: 1,
          more: false
        } as TranslationReviewerStatsData));

      const changes: SimpleChanges = {
        activeTab: {
          currentValue: component.TAB_NAME_TRANSLATION_REVIEWER,
          previousValue: component.TAB_NAME_TRANSLATION_SUBMITTER,
          firstChange: false,
          isFirstChange: () => false,
        },
      };
      component.inputs.activeTab = component.TAB_NAME_TRANSLATION_REVIEWER;
      component.ngOnChanges(changes);
      component.updateColumnsToDisplay();

      expect(component.columnsToDisplay).toEqual([
        'chevron',
        'contributorName',
        'reviewedTranslationsCount',
        'lastContributedInDays',
        'role'
      ]);
    }));

    it('should show question submitter stats', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats')
        .and.returnValue(Promise.resolve({
          stats: [],
          nextOffset: 1,
          more: false
        } as QuestionSubmitterStatsData));

      const changes: SimpleChanges = {
        activeTab: {
          currentValue: component.TAB_NAME_QUESTION_SUBMITTER,
          previousValue: component.TAB_NAME_TRANSLATION_REVIEWER,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.inputs.activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
      component.ngOnChanges(changes);
      component.updateColumnsToDisplay();

      expect(component.columnsToDisplay).toEqual([
        'chevron',
        'contributorName',
        'recentPerformance',
        'overallAccuracy',
        'submittedQuestionsCount',
        'lastContributedInDays',
        'role'
      ]);
    }));

    it('should show question reviewer stats', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats')
        .and.returnValue(Promise.resolve({
          stats: [],
          nextOffset: 1,
          more: false
        } as QuestionReviewerStatsData));

      const changes: SimpleChanges = {
        activeTab: {
          currentValue: component.TAB_NAME_QUESTION_REVIEWER,
          previousValue: component.TAB_NAME_QUESTION_SUBMITTER,
          firstChange: false,
          isFirstChange: () => false,
        },
      };
      component.inputs.activeTab = component.TAB_NAME_QUESTION_REVIEWER;
      component.ngOnChanges(changes);
      component.updateColumnsToDisplay();

      expect(component.columnsToDisplay).toEqual([
        'chevron',
        'contributorName',
        'reviewedQuestionsCount',
        'lastContributedInDays',
        'role'
      ]);
    }));

    it('should check for upperlimit for pagination', fakeAsync(() => {
      component.dataSource = [];
      component.statsPageNumber = 1;
      component.itemsPerPage = 3;
      fixture.detectChanges();
      expect(component.getUpperLimitValueForPagination()).toEqual(3);
    }));

    it('should navigate to next page', fakeAsync(() => {
      const goToSpy = spyOn(component, 'goToPageNumber');
      component.statsPageNumber = 1;
      fixture.detectChanges();

      component.navigatePage(component.MOVE_TO_NEXT_PAGE);

      expect(goToSpy).toHaveBeenCalledWith(2);
    }));

    it('should navigate to previous page', fakeAsync(() => {
      const goToSpy = spyOn(component, 'goToPageNumber');
      component.statsPageNumber = 1;
      fixture.detectChanges();

      component.navigatePage(component.MOVE_TO_PREV_PAGE);

      expect(goToSpy).toHaveBeenCalledWith(0);
    }));
  });

  describe('when user navigates to contributor admin page on mobile', () => {
    beforeEach(waitForAsync(() => {
      spyOnProperty($window.nativeWindow, 'innerWidth').and.returnValue(600);
    }));
    it('should show translation submitter stats', fakeAsync(() => {
      const changes: SimpleChanges = {
        activeTab: {
          currentValue: component.TAB_NAME_TRANSLATION_SUBMITTER,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.inputs.activeTab = component.TAB_NAME_TRANSLATION_SUBMITTER;
      component.ngOnChanges(changes);
      component.updateColumnsToDisplay();

      expect(component.columnsToDisplay).toEqual([
        'contributorName',
        'recentPerformance',
        'overallAccuracy',
        'submittedTranslationsCount',
        'lastContributedInDays',
        'role',
        'chevron'
      ]);
    }));

    it('should show translation reviewer stats', fakeAsync(() => {
      const changes: SimpleChanges = {
        activeTab: {
          currentValue: component.TAB_NAME_TRANSLATION_REVIEWER,
          previousValue: component.TAB_NAME_TRANSLATION_SUBMITTER,
          firstChange: false,
          isFirstChange: () => false,
        },
      };
      component.inputs.activeTab = component.TAB_NAME_TRANSLATION_REVIEWER;
      component.ngOnChanges(changes);
      component.updateColumnsToDisplay();

      expect(component.columnsToDisplay).toEqual([
        'contributorName',
        'reviewedTranslationsCount',
        'lastContributedInDays',
        'role',
        'chevron'
      ]);
    }));

    it('should show question submitter stats', fakeAsync(() => {
      const changes: SimpleChanges = {
        activeTab: {
          currentValue: component.TAB_NAME_QUESTION_SUBMITTER,
          previousValue: component.TAB_NAME_TRANSLATION_REVIEWER,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.inputs.activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
      component.ngOnChanges(changes);
      component.updateColumnsToDisplay();

      expect(component.columnsToDisplay).toEqual([
        'contributorName',
        'recentPerformance',
        'overallAccuracy',
        'submittedQuestionsCount',
        'lastContributedInDays',
        'role',
        'chevron'
      ]);
    }));

    it('should show question reviewer stats', fakeAsync(() => {
      const changes: SimpleChanges = {
        activeTab: {
          currentValue: component.TAB_NAME_QUESTION_REVIEWER,
          previousValue: component.TAB_NAME_QUESTION_SUBMITTER,
          firstChange: false,
          isFirstChange: () => false,
        },
      };
      component.inputs.activeTab = component.TAB_NAME_QUESTION_REVIEWER;
      component.ngOnChanges(changes);
      component.updateColumnsToDisplay();

      expect(component.columnsToDisplay).toEqual([
        'contributorName',
        'reviewedQuestionsCount',
        'lastContributedInDays',
        'role',
        'chevron'
      ]);

      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats')
        .and.returnValue(Promise.resolve({
          stats: [],
          nextOffset: 1,
          more: false
        } as QuestionReviewerStatsData));
    }));
  });

  it('should open question role editor modal and return changed value of' +
    ' translation submitter', fakeAsync(() => {
    const removeRightsSpy = spyOn(
      contributorDashboardAdminBackendApiService,
      'removeContributionReviewerAsync');
    const changes: SimpleChanges = {
      activeTab: {
        currentValue: component.TAB_NAME_QUESTION_SUBMITTER,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    };
    component.inputs.activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
    component.ngOnChanges(changes);
    spyOn(
      contributorDashboardAdminBackendApiService,
      'contributionReviewerRightsAsync').and.returnValue(Promise.resolve({
      can_submit_questions: true,
      can_review_questions: true,
      can_review_translation_for_language_codes: [],
      can_review_voiceover_for_language_codes: []
    }));
    let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
      return ({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve({
          isQuestionSubmitter: false,
          isQuestionReviewer: true
        })
      }) as NgbModalRef;
    });

    component.openRoleEditor('user1');
    tick();

    expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
    expect(removeRightsSpy).toHaveBeenCalled();
  }));

  it('should open question role editor modal and return false changed' +
    ' value of translation reviewer', fakeAsync(() => {
    const removeRightsSpy = spyOn(
      contributorDashboardAdminBackendApiService,
      'removeContributionReviewerAsync');
    const changes: SimpleChanges = {
      activeTab: {
        currentValue: component.TAB_NAME_QUESTION_SUBMITTER,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    };
    component.inputs.activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
    component.ngOnChanges(changes);
    spyOn(
      contributorDashboardAdminBackendApiService,
      'contributionReviewerRightsAsync').and.returnValue(Promise.resolve({
      can_submit_questions: true,
      can_review_questions: true,
      can_review_translation_for_language_codes: [],
      can_review_voiceover_for_language_codes: []
    }));
    let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
      return ({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve({
          isQuestionSubmitter: true,
          isQuestionReviewer: false
        })
      }) as NgbModalRef;
    });

    component.openRoleEditor('user1');
    tick();

    expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
    expect(removeRightsSpy).toHaveBeenCalled();
  }));

  it('should open question role editor modal and return true changed' +
    ' value of translation reviewer', fakeAsync(() => {
    const addRightsSpy = spyOn(
      contributorDashboardAdminBackendApiService,
      'addContributionReviewerAsync');
    const changes: SimpleChanges = {
      activeTab: {
        currentValue: component.TAB_NAME_QUESTION_SUBMITTER,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    };
    component.inputs.activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
    component.ngOnChanges(changes);
    spyOn(
      contributorDashboardAdminBackendApiService,
      'contributionReviewerRightsAsync').and.returnValue(Promise.resolve({
      can_submit_questions: true,
      can_review_questions: false,
      can_review_translation_for_language_codes: [],
      can_review_voiceover_for_language_codes: []
    }));
    let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
      return ({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve({
          isQuestionSubmitter: true,
          isQuestionReviewer: true
        })
      }) as NgbModalRef;
    });

    component.openRoleEditor('user1');
    tick();

    expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
    expect(addRightsSpy).toHaveBeenCalled();
  }));

  it('should open question role editor modal and return true changed' +
    ' value of translation submitter', fakeAsync(() => {
    const addRightsSpy = spyOn(
      contributorDashboardAdminBackendApiService,
      'addContributionReviewerAsync');
    const changes: SimpleChanges = {
      activeTab: {
        currentValue: component.TAB_NAME_QUESTION_SUBMITTER,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    };
    component.inputs.activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
    component.ngOnChanges(changes);
    spyOn(
      contributorDashboardAdminBackendApiService,
      'contributionReviewerRightsAsync').and.returnValue(Promise.resolve({
      can_submit_questions: false,
      can_review_questions: true,
      can_review_translation_for_language_codes: [],
      can_review_voiceover_for_language_codes: []
    }));
    let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
      return ({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve({
          isQuestionSubmitter: true,
          isQuestionReviewer: true
        })
      }) as NgbModalRef;
    });

    component.openRoleEditor('user1');
    tick();

    expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
    expect(addRightsSpy).toHaveBeenCalled();
  }));

  it('should open translation role editor modal', fakeAsync(() => {
    const changes: SimpleChanges = {
      activeTab: {
        currentValue: component.TAB_NAME_TRANSLATION_REVIEWER,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    };
    component.inputs.activeTab = component.TAB_NAME_TRANSLATION_REVIEWER;
    component.ngOnChanges(changes);
    spyOn(
      contributorDashboardAdminBackendApiService,
      'contributionReviewerRightsAsync').and.returnValue(Promise.resolve({
      can_submit_questions: false,
      can_review_questions: true,
      can_review_translation_for_language_codes: [],
      can_review_voiceover_for_language_codes: []
    }));
    let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
      return ({
        componentInstance: MockNgbModalRef
      }) as NgbModalRef;
    });

    component.openRoleEditor('user1');
    tick();

    expect(modalSpy).toHaveBeenCalledWith(CdAdminTranslationRoleEditorModal);
  }));
});
