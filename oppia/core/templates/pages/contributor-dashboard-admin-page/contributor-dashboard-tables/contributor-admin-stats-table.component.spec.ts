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

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA, SimpleChanges} from '@angular/core';
import {CdAdminTranslationRoleEditorModal} from '../translation-role-editor-modal/cd-admin-translation-role-editor-modal.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ContributorAdminStatsTable} from './contributor-admin-stats-table.component';
import {
  ContributorDashboardAdminStatsBackendApiService,
  QuestionReviewerStatsData,
  QuestionSubmitterStatsData,
  TranslationReviewerStatsData,
  TranslationSubmitterStatsData,
} from '../services/contributor-dashboard-admin-stats-backend-api.service';
import {ContributorDashboardAdminBackendApiService} from '../services/contributor-dashboard-admin-backend-api.service';
import {MatTableModule} from '@angular/material/table';
import {WindowRef} from 'services/contextual/window-ref.service';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {CdAdminQuestionRoleEditorModal} from '../question-role-editor-modal/cd-admin-question-role-editor-modal.component';
import {BrowserDynamicTestingModule} from '@angular/platform-browser-dynamic/testing';
import {
  QuestionReviewerStats,
  QuestionSubmitterStats,
  TranslationReviewerStats,
  TranslationSubmitterStats,
} from '../contributor-dashboard-admin-summary.model';

describe('Contributor stats component', () => {
  const createQuestionReviewerStats = function createQuestionReviewerStats(
    numStats: number
  ): QuestionReviewerStats[] {
    let stats: QuestionReviewerStats[] = [];
    for (let i = 0; i < numStats; i++) {
      stats.push(questionReviewerStats);
    }
    return stats;
  };
  let component: ContributorAdminStatsTable;
  let fixture: ComponentFixture<ContributorAdminStatsTable>;
  let $window: WindowRef;
  let contributorDashboardAdminStatsBackendApiService: ContributorDashboardAdminStatsBackendApiService;
  let contributorDashboardAdminBackendApiService: ContributorDashboardAdminBackendApiService;
  let ngbModal: NgbModal;
  class MockNgbModalRef {
    componentInstance!: {};
  }

  let translationSubmitterStats: TranslationSubmitterStats =
    new TranslationSubmitterStats(
      'user1',
      'en',
      ['topic1', 'topic2'],
      2,
      1.0,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      'firstcontributiondate',
      10
    );
  let translationReviewerStats: TranslationReviewerStats =
    new TranslationReviewerStats(
      'user1',
      'en',
      ['topic1', 'topic2'],
      2,
      1.0,
      3,
      4,
      5,
      'firstcontributiondate',
      10
    );
  let questionSubmitterStats: QuestionSubmitterStats =
    new QuestionSubmitterStats(
      'user1',
      ['topic1', 'topic2'],
      6,
      2,
      1.0,
      3,
      4,
      5,
      'firstcontributiondate',
      10
    );
  const questionReviewerStats: QuestionReviewerStats =
    new QuestionReviewerStats(
      'user1',
      ['topic1', 'topic2'],
      2,
      1,
      4,
      6,
      'firstcontributiondate',
      2
    );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatTableModule, MatTooltipModule],
      declarations: [
        CdAdminTranslationRoleEditorModal,
        ContributorAdminStatsTable,
      ],
      providers: [
        ContributorDashboardAdminStatsBackendApiService,
        ContributorDashboardAdminBackendApiService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideModule(BrowserDynamicTestingModule, {
        set: {
          entryComponents: [CdAdminTranslationRoleEditorModal],
        },
      })
      .compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ContributorAdminStatsTable);
    $window = TestBed.inject(WindowRef);
    component = fixture.componentInstance;

    contributorDashboardAdminStatsBackendApiService = TestBed.inject(
      ContributorDashboardAdminStatsBackendApiService
    );
    contributorDashboardAdminBackendApiService = TestBed.inject(
      ContributorDashboardAdminBackendApiService
    );
    ngbModal = TestBed.inject(NgbModal);

    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property innerWidth does not have access type get' error.
    // eslint-disable-next-line max-len
    // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
    // ref: https://github.com/jasmine/jasmine/issues/1415
    Object.defineProperty($window.nativeWindow, 'innerWidth', {
      get: () => undefined,
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
        'fetchContributorAdminStats'
      ).and.returnValue(
        Promise.resolve({
          stats: [translationSubmitterStats],
          nextOffset: 1,
          more: false,
        } as TranslationSubmitterStatsData)
      );

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
      component.displayContributorAdminStats();
      tick();
      expect(component.columnsToDisplay).toEqual([
        'chevron',
        'contributorName',
        'recentPerformance',
        'overallAccuracy',
        'contributionCount',
        'lastContributedInDays',
        'role',
      ]);
    }));

    it('should show translation reviewer stats', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats'
      ).and.returnValue(
        Promise.resolve({
          stats: [translationReviewerStats],
          nextOffset: 1,
          more: false,
        } as TranslationReviewerStatsData)
      );
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
      component.displayContributorAdminStats();
      tick();
      expect(component.columnsToDisplay).toEqual([
        'chevron',
        'contributorName',
        'contributionCount',
        'lastContributedInDays',
        'role',
      ]);
    }));

    it('should show question submitter stats', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats'
      ).and.returnValue(
        Promise.resolve({
          stats: [questionSubmitterStats],
          nextOffset: 1,
          more: false,
        } as QuestionSubmitterStatsData)
      );
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
      component.displayContributorAdminStats();
      tick();
      expect(component.columnsToDisplay).toEqual([
        'chevron',
        'contributorName',
        'recentPerformance',
        'overallAccuracy',
        'contributionCount',
        'lastContributedInDays',
        'role',
      ]);
      expect(component.getOverallItemCount()).toEqual('1');
    }));

    it('should show question reviewer stats', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats'
      ).and.returnValue(
        Promise.resolve({
          stats: [questionReviewerStats],
          nextOffset: 1,
          more: true,
        } as QuestionReviewerStatsData)
      );
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
      component.displayContributorAdminStats();
      tick();
      expect(component.columnsToDisplay).toEqual([
        'chevron',
        'contributorName',
        'contributionCount',
        'lastContributedInDays',
        'role',
      ]);
      expect(component.getOverallItemCount()).toEqual('1+');
    }));

    it(
      'should index last item on page as "overall item count" when ' +
        '"current page\'s cumulative item count"' +
        ' exceeds "overall item count".',
      fakeAsync(() => {
        component.statsPageNumber = 1;
        component.itemsPerPage = 4;
        fixture.detectChanges();
        component.allStats = createQuestionReviewerStats(3);
        expect(component.getIndexOfLastItemOnPage()).toEqual(3);
      })
    );

    it(
      'should index last item on page as "current page\'s ' +
        'cumulative item count" when "overall item count"' +
        ' exceeds "current page\'s cumulative item count".',
      fakeAsync(() => {
        component.statsPageNumber = 1;
        component.itemsPerPage = 1;
        fixture.detectChanges();
        component.allStats = createQuestionReviewerStats(3);
        expect(component.getIndexOfLastItemOnPage()).toEqual(2);
      })
    );

    it('should retrieve the index of the first item on the page', fakeAsync(() => {
      component.statsPageNumber = 2;
      component.itemsPerPage = 3;
      expect(component.getDisplayedIndexOfFirstItemOnPage()).toEqual(7);
    }));

    it('should show the overall item count from the number of items', fakeAsync(() => {
      component.statsPageNumber = 1;
      component.itemsPerPage = 1;
      fixture.detectChanges();
      component.allStats = createQuestionReviewerStats(3);
      expect(component.getOverallItemCount()).toEqual(
        component.allStats.length.toString()
      );
    }));

    it(
      'should show a "+" at the end of the overall item count when ' +
        'the number of items exceeds max expected',
      fakeAsync(() => {
        component.statsPageNumber = 1;
        component.itemsPerPage = 1;
        component.tableHasMoreThanMaximumExpectedItems = true;
        fixture.detectChanges();
        component.allStats = createQuestionReviewerStats(1000);
        expect(component.getOverallItemCount()).toEqual('1000+');
      })
    );

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
      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats'
      ).and.returnValue(
        Promise.resolve({
          stats: [translationSubmitterStats],
          nextOffset: 1,
          more: false,
        } as TranslationSubmitterStatsData)
      );
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
      component.displayContributorAdminStats();
      tick();
      expect(component.columnsToDisplay).toEqual([
        'contributorName',
        'recentPerformance',
        'overallAccuracy',
        'contributionCount',
        'lastContributedInDays',
        'role',
        'chevron',
      ]);
    }));

    it('should show translation reviewer stats', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats'
      ).and.returnValue(
        Promise.resolve({
          stats: [translationReviewerStats],
          nextOffset: 1,
          more: false,
        } as TranslationReviewerStatsData)
      );
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
      component.displayContributorAdminStats();
      tick();
      expect(component.columnsToDisplay).toEqual([
        'contributorName',
        'contributionCount',
        'lastContributedInDays',
        'role',
        'chevron',
      ]);
    }));

    it('should show question submitter stats', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats'
      ).and.returnValue(
        Promise.resolve({
          stats: [questionSubmitterStats],
          nextOffset: 1,
          more: false,
        } as QuestionSubmitterStatsData)
      );
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
      component.displayContributorAdminStats();
      tick();
      expect(component.columnsToDisplay).toEqual([
        'contributorName',
        'recentPerformance',
        'overallAccuracy',
        'contributionCount',
        'lastContributedInDays',
        'role',
        'chevron',
      ]);
    }));

    it('should show question reviewer stats', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats'
      ).and.returnValue(
        Promise.resolve({
          stats: [questionReviewerStats],
          nextOffset: 1,
          more: false,
        } as QuestionReviewerStatsData)
      );
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
      component.displayContributorAdminStats();
      tick();
      expect(component.columnsToDisplay).toEqual([
        'contributorName',
        'contributionCount',
        'lastContributedInDays',
        'role',
        'chevron',
      ]);
    }));
  });

  it(
    'should open question role editor modal and return changed value of' +
      ' translation submitter',
    fakeAsync(() => {
      const removeRightsSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'removeContributionReviewerAsync'
      );
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
        'contributionReviewerRightsAsync'
      ).and.returnValue(
        Promise.resolve({
          can_submit_questions: true,
          can_review_questions: true,
          can_review_translation_for_language_codes: [],
          can_review_voiceover_for_language_codes: [],
        })
      );
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve({
            isQuestionSubmitter: false,
            isQuestionReviewer: true,
          }),
        } as NgbModalRef;
      });

      component.openRoleEditor('user1');
      tick();

      expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
      expect(removeRightsSpy).toHaveBeenCalled();
    })
  );

  it(
    'should open question role editor modal and return false changed' +
      ' value of translation reviewer',
    fakeAsync(() => {
      const removeRightsSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'removeContributionReviewerAsync'
      );
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
        'contributionReviewerRightsAsync'
      ).and.returnValue(
        Promise.resolve({
          can_submit_questions: true,
          can_review_questions: true,
          can_review_translation_for_language_codes: [],
          can_review_voiceover_for_language_codes: [],
        })
      );
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve({
            isQuestionSubmitter: true,
            isQuestionReviewer: false,
          }),
        } as NgbModalRef;
      });

      component.openRoleEditor('user1');
      tick();

      expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
      expect(removeRightsSpy).toHaveBeenCalled();
    })
  );

  it(
    'should open question role editor modal and return true changed' +
      ' value of translation reviewer',
    fakeAsync(() => {
      const addRightsSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'addContributionReviewerAsync'
      );
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
        'contributionReviewerRightsAsync'
      ).and.returnValue(
        Promise.resolve({
          can_submit_questions: true,
          can_review_questions: false,
          can_review_translation_for_language_codes: [],
          can_review_voiceover_for_language_codes: [],
        })
      );
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve({
            isQuestionSubmitter: true,
            isQuestionReviewer: true,
          }),
        } as NgbModalRef;
      });

      component.openRoleEditor('user1');
      tick();

      expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
      expect(addRightsSpy).toHaveBeenCalled();
    })
  );

  it(
    'should open question role editor modal and return true changed' +
      ' value of translation submitter',
    fakeAsync(() => {
      const addRightsSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'addContributionReviewerAsync'
      );
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
        'contributionReviewerRightsAsync'
      ).and.returnValue(
        Promise.resolve({
          can_submit_questions: false,
          can_review_questions: true,
          can_review_translation_for_language_codes: [],
          can_review_voiceover_for_language_codes: [],
        })
      );
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve({
            isQuestionSubmitter: true,
            isQuestionReviewer: true,
          }),
        } as NgbModalRef;
      });

      component.openRoleEditor('user1');
      tick();

      expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
      expect(addRightsSpy).toHaveBeenCalled();
    })
  );

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
      'contributionReviewerRightsAsync'
    ).and.returnValue(
      Promise.resolve({
        can_submit_questions: false,
        can_review_questions: true,
        can_review_translation_for_language_codes: [],
        can_review_voiceover_for_language_codes: [],
      })
    );
    let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
      return {
        componentInstance: MockNgbModalRef,
      } as NgbModalRef;
    });

    component.openRoleEditor('user1');
    tick();

    expect(modalSpy).toHaveBeenCalledWith(CdAdminTranslationRoleEditorModal);
  }));

  describe('when displaying the stats table', () => {
    it('should return the translation submitter stats attributes correctly', fakeAsync(() => {
      expect(
        component.getFormattedContributorAttributes(translationSubmitterStats)
      ).toEqual([
        {
          key: 'Date Joined',
          displayText: 'firstcontributiondate',
        },
        {
          key: 'Submitted Translations',
          displayText: '3 cards, 4 words',
        },
        {
          key: 'Accepted Translations',
          displayText: '5 cards (6 without edits), 7 words',
        },
        {
          key: 'Rejected Translations',
          displayText: '8 cards, 9 words',
        },
        {
          key: 'Active Topics',
          displayText: 'topic1, topic2',
        },
      ]);
    }));

    it('should return the translation reviewer stats attributes correctly', fakeAsync(() => {
      expect(
        component.getFormattedContributorAttributes(translationReviewerStats)
      ).toEqual([
        {
          key: 'Date Joined',
          displayText: 'firstcontributiondate',
        },
        {
          key: 'Accepted Translations',
          displayText: '1 card (3 edited), 4 words',
        },
        {
          key: 'Rejected Translations',
          displayText: '5 cards',
        },
        {
          key: 'Active Topics',
          displayText: 'topic1, topic2',
        },
      ]);
    }));

    it('should return the question submitter stats attributes correctly', fakeAsync(() => {
      expect(
        component.getFormattedContributorAttributes(questionSubmitterStats)
      ).toEqual([
        {
          key: 'Date Joined',
          displayText: 'firstcontributiondate',
        },
        {
          key: 'Submitted Questions',
          displayText: '1 card',
        },
        {
          key: 'Accepted Questions',
          displayText: '3 cards (4 without edits)',
        },
        {
          key: 'Rejected Questions',
          displayText: '5 cards',
        },
        {
          key: 'Active Topics',
          displayText: 'topic1, topic2',
        },
      ]);
    }));

    it('should return the question reviewer stats attributes correctly', fakeAsync(() => {
      expect(
        component.getFormattedContributorAttributes(questionReviewerStats)
      ).toEqual([
        {
          key: 'Date Joined',
          displayText: 'firstcontributiondate',
        },
        {
          key: 'Reviewed Questions',
          displayText: '2',
        },
        {
          key: 'Accepted Questions',
          displayText: '1 card (4 edited)',
        },
        {
          key: 'Rejected Questions',
          displayText: '6 cards',
        },
        {
          key: 'Active Topics',
          displayText: 'topic1, topic2',
        },
      ]);
    }));

    it('should return the last contributed type correctly', fakeAsync(() => {
      let activeTab = component.TAB_NAME_TRANSLATION_SUBMITTER;
      expect(component.getLastContributedType(activeTab)).toEqual(
        'Last Translated'
      );
      activeTab = component.TAB_NAME_TRANSLATION_REVIEWER;
      expect(component.getLastContributedType(activeTab)).toEqual(
        'Last Reviewed'
      );
      activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
      expect(component.getLastContributedType(activeTab)).toEqual(
        'Last Submitted'
      );
      activeTab = component.TAB_NAME_QUESTION_REVIEWER;
      expect(component.getLastContributedType(activeTab)).toEqual(
        'Last Reviewed'
      );
    }));

    it('should return the contribution count label correctly', fakeAsync(() => {
      let activeTab = component.TAB_NAME_TRANSLATION_SUBMITTER;
      expect(component.getContributionCountLabel(activeTab)).toEqual(
        'Translated Cards'
      );
      activeTab = component.TAB_NAME_TRANSLATION_REVIEWER;
      expect(component.getContributionCountLabel(activeTab)).toEqual(
        'Reviewed Cards'
      );
      activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
      expect(component.getContributionCountLabel(activeTab)).toEqual(
        'Questions Submitted'
      );
      activeTab = component.TAB_NAME_QUESTION_REVIEWER;
      expect(component.getContributionCountLabel(activeTab)).toEqual(
        'Questions Reviewed'
      );
    }));

    it('should return the contribution count correctly', fakeAsync(() => {
      let activeTab = component.TAB_NAME_TRANSLATION_SUBMITTER;
      expect(component.getContributionCount(activeTab, 1, 2, 3, 4)).toEqual(1);
      activeTab = component.TAB_NAME_TRANSLATION_REVIEWER;
      expect(component.getContributionCount(activeTab, 1, 2, 3, 4)).toEqual(2);
      activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
      expect(component.getContributionCount(activeTab, 1, 2, 3, 4)).toEqual(3);
      activeTab = component.TAB_NAME_QUESTION_REVIEWER;
      expect(component.getContributionCount(activeTab, 1, 2, 3, 4)).toEqual(4);
    }));

    it('should convert the items per page dropdown back into numbers', fakeAsync(() => {
      component.onItemsPerPageChange('05');
      expect(component.itemsPerPage).toEqual(5);
    }));
  });

  describe('when more than one page of stats are returned', () => {
    it('should show data on multiple pages', fakeAsync(() => {
      let allQuestionReviewerStats: QuestionReviewerStats[] =
        createQuestionReviewerStats(30);

      spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats'
      ).and.returnValue(
        Promise.resolve({
          stats: allQuestionReviewerStats,
          nextOffset: 1,
          more: false,
        } as QuestionReviewerStatsData)
      );
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

      tick();
      expect(component.getOverallItemCount()).toEqual('30');
      expect(component.displayStatsForCurrentPage().length).toEqual(20);
      expect(component.tableCanShowMoreItems).toEqual(true);

      component.goToPageNumber(1);
      expect(component.displayStatsForCurrentPage().length).toEqual(10);
      expect(component.tableCanShowMoreItems).toEqual(false);
    }));
  });
});
