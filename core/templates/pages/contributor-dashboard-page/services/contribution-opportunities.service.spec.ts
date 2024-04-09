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
 * @fileoverview Unit tests for Contribution Opportunities Service.
 */

import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {
  ContributionOpportunitiesService,
  ExplorationOpportunitiesDict,
  SkillOpportunitiesDict,
} from '../services/contribution-opportunities.service';
import {ContributionOpportunitiesBackendApiService} from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {LoginRequiredModalContent} from '../modal-templates/login-required-modal.component';
import {SkillOpportunity} from 'domain/opportunity/skill-opportunity.model';
import {ExplorationOpportunitySummary} from 'domain/opportunity/exploration-opportunity-summary.model';
class MockNgbModalRef {
  componentInstance!: {};
}

describe('Contribution Opportunities Service', () => {
  let ngbModal: NgbModal;
  let contributionOpportunitiesBackendApiService: ContributionOpportunitiesBackendApiService;
  let contributionOpportunitiesService: ContributionOpportunitiesService;

  const skillOpportunityResponse = {
    opportunities: [
      {
        id: 'skill_id',
        skill_description: 'A new skill for question',
        topic_name: 'A new topic',
        question_count: 30,
      },
    ],
    next_cursor: '6',
    more: true,
  };

  const skillOpportunity = {
    opportunities: [
      {
        id: 'exp_id',
        topic_name: 'Topic',
        story_title: 'A new story',
        chapter_title: 'Introduction',
        content_count: 100,
        translation_counts: {
          hi: 15,
        },
        translation_in_review_counts: {
          hi: 20,
        },
        language_code: 'hi',
        is_pinned: false,
      },
    ],
    next_cursor: '6',
    more: true,
  };

  const sampleSkillOpportunitiesResponse = [
    SkillOpportunity.createFromBackendDict(
      skillOpportunityResponse.opportunities[0]
    ),
  ];

  const sampleTranslationOpportunitiesResponse = [
    ExplorationOpportunitySummary.createFromBackendDict(
      skillOpportunity.opportunities[0]
    ),
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
  });

  beforeEach(() => {
    contributionOpportunitiesBackendApiService = TestBed.inject(
      ContributionOpportunitiesBackendApiService
    );
    ngbModal = TestBed.inject(NgbModal);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService
    );
  });

  it('should open login modal when user is not logged in', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockNgbModalRef,
        result: Promise.resolve('success'),
      } as NgbModalRef;
    });

    contributionOpportunitiesService.showRequiresLoginModal();

    expect(modalSpy).toHaveBeenCalledWith(LoginRequiredModalContent);
  });

  it(
    'should return skill opportunities when calling ' +
      "'getSkillOpportunitiesAsync'",
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      let skillOpportunitiesDict: SkillOpportunitiesDict = {
        opportunities: sampleSkillOpportunitiesResponse,
        more: skillOpportunityResponse.more,
      };

      let getSkillOpportunitiesSpy = spyOn(
        contributionOpportunitiesBackendApiService,
        'fetchSkillOpportunitiesAsync'
      ).and.returnValue(
        Promise.resolve({
          opportunities: sampleSkillOpportunitiesResponse,
          nextCursor: skillOpportunityResponse.next_cursor,
          more: skillOpportunityResponse.more,
        })
      );

      contributionOpportunitiesService
        .getSkillOpportunitiesAsync()
        .then(successHandler, failHandler);
      tick();

      expect(getSkillOpportunitiesSpy).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalledWith(skillOpportunitiesDict);
    })
  );

  it(
    'should return more skill opportunities if they are available ' +
      "when calling 'getMoreSkillOpportunitiesAsync'",
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      let skillOpportunitiesDict: SkillOpportunitiesDict = {
        opportunities: sampleSkillOpportunitiesResponse,
        more: skillOpportunityResponse.more,
      };

      let getSkillOpportunitiesSpy = spyOn(
        contributionOpportunitiesBackendApiService,
        'fetchSkillOpportunitiesAsync'
      ).and.returnValue(
        Promise.resolve({
          opportunities: sampleSkillOpportunitiesResponse,
          nextCursor: skillOpportunityResponse.next_cursor,
          more: skillOpportunityResponse.more,
        })
      );

      contributionOpportunitiesService
        .getMoreSkillOpportunitiesAsync()
        .then(successHandler, failHandler);
      tick();

      expect(getSkillOpportunitiesSpy).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalledWith(skillOpportunitiesDict);
    })
  );

  it(
    'should throw error if no more skill opportunity is available ' +
      "when calling 'getMoreSkillOpportunitiesAsync'",
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      let getSkillOpportunitiesSpy = spyOn(
        contributionOpportunitiesBackendApiService,
        'fetchSkillOpportunitiesAsync'
      ).and.returnValue(
        Promise.resolve({
          opportunities: sampleSkillOpportunitiesResponse,
          nextCursor: skillOpportunityResponse.next_cursor,
          more: false,
        })
      );

      contributionOpportunitiesService
        .getMoreSkillOpportunitiesAsync()
        .then(successHandler, failHandler);
      tick();

      expect(getSkillOpportunitiesSpy).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();

      contributionOpportunitiesService
        .getMoreSkillOpportunitiesAsync()
        .then(successHandler, failHandler);
      tick();

      expect(failHandler).toHaveBeenCalled();
    })
  );

  it(
    'should return translation opportunities when calling ' +
      "'getTranslationOpportunitiesAsync'",
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      let translationOpportunitiesDict: ExplorationOpportunitiesDict = {
        opportunities: sampleTranslationOpportunitiesResponse,
        more: true,
      };

      let getTranslationOpportunitiesSpy = spyOn(
        contributionOpportunitiesBackendApiService,
        'fetchTranslationOpportunitiesAsync'
      ).and.returnValue(
        Promise.resolve({
          opportunities: sampleTranslationOpportunitiesResponse,
          nextCursor: '6',
          more: true,
        })
      );

      contributionOpportunitiesService
        .getTranslationOpportunitiesAsync('en', 'Topic')
        .then(successHandler, failHandler);
      tick();

      expect(getTranslationOpportunitiesSpy).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalledWith(translationOpportunitiesDict);
    })
  );

  it(
    'should return more translation opportunities if they are available ' +
      "when calling 'getMoreTranslationOpportunitiesAsync'",
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      let translationOpportunitiesDict: ExplorationOpportunitiesDict = {
        opportunities: sampleTranslationOpportunitiesResponse,
        more: true,
      };

      let getTranslationOpportunitiesSpy = spyOn(
        contributionOpportunitiesBackendApiService,
        'fetchTranslationOpportunitiesAsync'
      ).and.returnValue(
        Promise.resolve({
          opportunities: sampleTranslationOpportunitiesResponse,
          nextCursor: '6',
          more: true,
        })
      );

      contributionOpportunitiesService
        .getMoreTranslationOpportunitiesAsync('en', 'Topic')
        .then(successHandler, failHandler);
      tick();

      expect(getTranslationOpportunitiesSpy).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalledWith(translationOpportunitiesDict);
    })
  );

  it(
    'should return reviewable translation opportunities when calling ' +
      "'getReviewableTranslationOpportunitiesAsync'",
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');
      const translationOpportunitiesDict: ExplorationOpportunitiesDict = {
        opportunities: sampleTranslationOpportunitiesResponse,
        more: false,
      };
      const getReviewableTranslationOpportunitiesSpy = spyOn(
        contributionOpportunitiesBackendApiService,
        'fetchReviewableTranslationOpportunitiesAsync'
      ).and.returnValue(
        Promise.resolve({
          opportunities: sampleTranslationOpportunitiesResponse,
          more: false,
        })
      );

      contributionOpportunitiesService
        .getReviewableTranslationOpportunitiesAsync('Topic')
        .then(successHandler, failHandler);
      tick();

      expect(getReviewableTranslationOpportunitiesSpy).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalledWith(translationOpportunitiesDict);
    })
  );

  it(
    'should throw error if no more translation opportunities is available ' +
      "when calling 'getMoreTranslationOpportunitiesAsync'",
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      let getTranslationOpportunitiesSpy = spyOn(
        contributionOpportunitiesBackendApiService,
        'fetchTranslationOpportunitiesAsync'
      ).and.returnValue(
        Promise.resolve({
          opportunities: sampleTranslationOpportunitiesResponse,
          nextCursor: '6',
          more: false,
        })
      );

      contributionOpportunitiesService
        .getMoreTranslationOpportunitiesAsync('en', 'Topic')
        .then(successHandler, failHandler);
      tick();

      expect(getTranslationOpportunitiesSpy).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();

      contributionOpportunitiesService
        .getMoreTranslationOpportunitiesAsync('en', 'Topic')
        .then(successHandler, failHandler);
      tick();

      expect(failHandler).toHaveBeenCalled();
    })
  );

  it(
    'should return topic names when calling ' +
      "'getTranslatableTopicNamesAsync'",
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      let topicNamesDict = ['Topic 1', 'Topic 2'];

      let getTranslatableTopicNamesSpy = spyOn(
        contributionOpportunitiesBackendApiService,
        'fetchTranslatableTopicNamesAsync'
      ).and.returnValue(Promise.resolve(topicNamesDict));

      contributionOpportunitiesService
        .getTranslatableTopicNamesAsync()
        .then(successHandler, failHandler);
      tick();

      expect(getTranslatableTopicNamesSpy).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalledWith(topicNamesDict);
    })
  );

  it(
    'should successfully pin reviewable pinned translation' + ' opportunities',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      let pinTranslationOpportunitySpy = spyOn(
        contributionOpportunitiesBackendApiService,
        'pinTranslationOpportunity'
      ).and.returnValue(Promise.resolve<void>(undefined));

      contributionOpportunitiesService
        .pinReviewableTranslationOpportunityAsync('Topic 1', 'en', 'exp 1')
        .then(successHandler, failHandler);
      tick();

      expect(pinTranslationOpportunitySpy).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    })
  );

  it(
    'should successfully unpin reviewable pinned translation' +
      ' opportunities',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      let unpinTranslationOpportunitySpy = spyOn(
        contributionOpportunitiesBackendApiService,
        'unpinTranslationOpportunity'
      ).and.returnValue(Promise.resolve<void>(undefined));

      contributionOpportunitiesService
        .unpinReviewableTranslationOpportunityAsync('Topic 1', 'en', '1')
        .then(successHandler, failHandler);
      tick();

      expect(unpinTranslationOpportunitySpy).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    })
  );
});
