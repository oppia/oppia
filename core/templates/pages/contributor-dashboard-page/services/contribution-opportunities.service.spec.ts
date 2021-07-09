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

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ContributionOpportunitiesService, ExplorationOpportunitiesDict, SkillOpportunitiesDict } from '../services/contribution-opportunities.service';
import { ContributionOpportunitiesBackendApiService } from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { LoginRequiredModalContent } from '../modal-templates/login-required-modal.component';
import { SkillOpportunity } from 'domain/opportunity/skill-opportunity.model';
import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';
class MockNgbModalRef {
  componentInstance: {};
}

describe('Contribution Opportunities Service', function() {
  let ngbModal: NgbModal;
  let contributionOpportunitiesBackendApiService:
    ContributionOpportunitiesBackendApiService;
  let contributionOpportunitiesService: ContributionOpportunitiesService;

  const skillOpportunityResponse = {
    opportunities: [{
      id: 'skill_id',
      skill_description: 'A new skill for question',
      topic_name: 'A new topic',
      question_count: 30
    }],
    next_cursor: '6',
    more: true
  };

  const skillOpportunity = {
    opportunities: [{
      id: 'exp_id',
      topic_name: 'Topic',
      story_title: 'A new story',
      chapter_title: 'Introduction',
      content_count: 100,
      translation_counts: {
        hi: 15
      }
    }],
    next_cursor: '6',
    more: true
  };

  const sampleSkillOpportunitiesResponse = [
    SkillOpportunity.createFromBackendDict(
      skillOpportunityResponse.opportunities[0])
  ];

  const sampleTranslationOpportunitiesResponse = [
    ExplorationOpportunitySummary.createFromBackendDict(
      skillOpportunity.opportunities[0])
  ];

  const sampleVoiceoverOpportunitiesResponse = [
    ExplorationOpportunitySummary.createFromBackendDict(
      skillOpportunity.opportunities[0])
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    });
  });

  beforeEach(() => {
    contributionOpportunitiesBackendApiService = TestBed.inject(
      ContributionOpportunitiesBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService);
  });

  it('should open login modal when user is not logged in', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return <NgbModalRef>(
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('success')
        });
    });

    contributionOpportunitiesService.showRequiresLoginModal();

    expect(modalSpy).toHaveBeenCalledWith(LoginRequiredModalContent);
  });

  it('should return skill opportunities when calling ' +
    '\'getSkillOpportunitiesAsync\'', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    let skillOpportunitiesDict: SkillOpportunitiesDict = {
      opportunities: sampleSkillOpportunitiesResponse,
      more: skillOpportunityResponse.more
    };

    let getSkillOpportunitiesSpy = spyOn(
      contributionOpportunitiesBackendApiService,
      'fetchSkillOpportunitiesAsync')
      .and.returnValue(Promise.resolve(
        {
          opportunities: sampleSkillOpportunitiesResponse,
          nextCursor: skillOpportunityResponse.next_cursor,
          more: skillOpportunityResponse.more
        }
      ));

    contributionOpportunitiesService.getSkillOpportunitiesAsync().then(
      successHandler, failHandler);
    tick();

    expect(getSkillOpportunitiesSpy).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalledWith(skillOpportunitiesDict);
  }));

  it('should return more skill opportunities if they are available ' +
    'when calling \'getMoreSkillOpportunitiesAsync\'', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    let skillOpportunitiesDict: SkillOpportunitiesDict = {
      opportunities: sampleSkillOpportunitiesResponse,
      more: skillOpportunityResponse.more
    };

    let getSkillOpportunitiesSpy = spyOn(
      contributionOpportunitiesBackendApiService,
      'fetchSkillOpportunitiesAsync')
      .and.returnValue(Promise.resolve(
        {
          opportunities: sampleSkillOpportunitiesResponse,
          nextCursor: skillOpportunityResponse.next_cursor,
          more: skillOpportunityResponse.more
        }
      ));

    contributionOpportunitiesService.getMoreSkillOpportunitiesAsync().then(
      successHandler, failHandler);
    tick();

    expect(getSkillOpportunitiesSpy).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalledWith(skillOpportunitiesDict);
  }));

  it('should return translation opportunities when calling ' +
    '\'getTranslationOpportunitiesAsync\'', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    let translationOpportunitiesDict: ExplorationOpportunitiesDict = {
      opportunities: sampleTranslationOpportunitiesResponse,
      more: true
    };

    let getTranslationOpportunitiesSpy = spyOn(
      contributionOpportunitiesBackendApiService,
      'fetchTranslationOpportunitiesAsync')
      .and.returnValue(Promise.resolve(
        {
          opportunities: sampleTranslationOpportunitiesResponse,
          nextCursor: '6',
          more: true
        }
      ));

    contributionOpportunitiesService.getTranslationOpportunitiesAsync('en')
      .then(successHandler, failHandler);
    tick();

    expect(getTranslationOpportunitiesSpy).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalledWith(translationOpportunitiesDict);
  }));

  it('should return more translation opportunities if they are available ' +
    'when calling \'getMoreTranslationOpportunitiesAsync\'', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    let translationOpportunitiesDict: ExplorationOpportunitiesDict = {
      opportunities: sampleTranslationOpportunitiesResponse,
      more: true
    };

    let getTranslationOpportunitiesSpy = spyOn(
      contributionOpportunitiesBackendApiService,
      'fetchTranslationOpportunitiesAsync')
      .and.returnValue(Promise.resolve(
        {
          opportunities: sampleTranslationOpportunitiesResponse,
          nextCursor: '6',
          more: true
        }
      ));

    contributionOpportunitiesService.getMoreTranslationOpportunitiesAsync('en')
      .then(successHandler, failHandler);
    tick();

    expect(getTranslationOpportunitiesSpy).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalledWith(translationOpportunitiesDict);
  }));

  it('should return voiceover opportunities when calling ' +
    '\'getVoiceoverOpportunitiesAsync\'', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    let voiceoverOpportunitiesDict: ExplorationOpportunitiesDict = {
      opportunities: sampleVoiceoverOpportunitiesResponse,
      more: true
    };

    let getVoiceoverOpportunitiesSpy = spyOn(
      contributionOpportunitiesBackendApiService,
      'fetchVoiceoverOpportunitiesAsync')
      .and.returnValue(Promise.resolve(
        {
          opportunities: sampleVoiceoverOpportunitiesResponse,
          nextCursor: '6',
          more: true
        }
      ));

    contributionOpportunitiesService.getVoiceoverOpportunitiesAsync('en').then(
      successHandler, failHandler);
    tick();

    expect(getVoiceoverOpportunitiesSpy).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalledWith(voiceoverOpportunitiesDict);
  }));

  it('should return more voiceover opportunities if they are available ' +
    'when calling \'getMoreVoiceoverOpportunitiesAsync\'', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    let voiceoverOpportunitiesDict: ExplorationOpportunitiesDict = {
      opportunities: sampleVoiceoverOpportunitiesResponse,
      more: true
    };

    let getVoiceoverOpportunitiesSpy = spyOn(
      contributionOpportunitiesBackendApiService,
      'fetchVoiceoverOpportunitiesAsync')
      .and.returnValue(Promise.resolve(
        {
          opportunities: sampleVoiceoverOpportunitiesResponse,
          nextCursor: '6',
          more: true
        }
      ));

    contributionOpportunitiesService.getMoreVoiceoverOpportunitiesAsync('en')
      .then(successHandler, failHandler);
    tick();

    expect(getVoiceoverOpportunitiesSpy).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalledWith(voiceoverOpportunitiesDict);
  }));
});
