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
 * @fileoverview Unit tests for the Learner view info directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';

import { LearnerViewInfoBackendApiService } from '../services/learner-view-info-backend-api.service';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { ContextService } from 'services/context.service';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';

describe('Learner view info directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let directive = null;
  let learnerViewInfoBackendApiService: LearnerViewInfoBackendApiService = null;
  let $uibModal = null;
  let contextService: ContextService = null;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService = null;
  let urlService: UrlService = null;

  let explorationBackendResponse = null;
  let storyBackendDict = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });


  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    directive = $injector.get('learnerViewInfoDirective')[0];
    contextService = $injector.get('ContextService');
    learnerViewInfoBackendApiService = $injector.get(
      'LearnerViewInfoBackendApiService');
    readOnlyExplorationBackendApiService = $injector.get(
      'ReadOnlyExplorationBackendApiService');
    urlService = $injector.get('UrlService');
    OppiaAngularRootComponent.storyViewerBackendApiService = $injector.get(
      'StoryViewerBackendApiService');

    explorationBackendResponse = {
      can_edit: true,
      exploration: {
        init_state_name: 'state_name',
        param_changes: [],
        param_specs: {},
        states: {},
        title: 'Title',
        language_code: '',
        objective: '',
        correctness_feedback_enabled: false
      },
      exploration_id: 'test_id',
      is_logged_in: true,
      session_id: 'test_session',
      version: 1,
      preferred_audio_language_code: 'en',
      preferred_language_codes: [],
      auto_tts_enabled: false,
      correctness_feedback_enabled: true,
      record_playthrough_probability: 1
    };

    storyBackendDict = StoryPlaythrough.createFromBackendDict({
      story_id: 'id',
      story_nodes: [],
      story_title: 'title',
      story_description: 'description',
      topic_name: 'topic_1',
      meta_tag_content: 'this is a meta tag content'
    });

    spyOn(
      OppiaAngularRootComponent.storyViewerBackendApiService,
      'fetchStoryDataAsync').and.resolveTo(storyBackendDict);
    spyOn(contextService, 'getExplorationId').and.returnValue('expId');
    spyOn(readOnlyExplorationBackendApiService, 'fetchExplorationAsync')
      .and.returnValue(Promise.resolve(explorationBackendResponse));

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
  }));

  afterEach(function() {
    ctrl.$onDestroy();
  });

  it('should set properties when initialized', fakeAsync(function() {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl')
      .and.returnValue('topicUrlFragment');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('classroomUrlFragment');

    expect(ctrl.explorationTitle).toBe(undefined);
    expect(ctrl.isLinkedToTopic).toBe(undefined);

    ctrl.$onInit();
    tick();
    $scope.$apply();

    expect(ctrl.explorationTitle).toBe('Title');
    expect(ctrl.isLinkedToTopic).toBe(true);
  }));

  it('should set \'isLinkedToTopic\' property to false ' +
    'when error is occured while initializing', function() {
    expect(ctrl.isLinkedToTopic).toBe(undefined);

    ctrl.$onInit();

    expect(ctrl.isLinkedToTopic).toBe(false);
  });

  it('should open information card modal', fakeAsync(function() {
    spyOn(learnerViewInfoBackendApiService, 'fetchLearnerInfoAsync')
      .and.resolveTo({
        summaries: ['summary1']
      });
    const modalSpy = spyOn($uibModal, 'open').and.callThrough();

    // First card.
    ctrl.showInformationCard();
    tick();
    $scope.$apply();

    // Second card.
    ctrl.showInformationCard();
    tick();
    $scope.$apply();

    expect(modalSpy).toHaveBeenCalledTimes(2);
  }));

  it('should fail to open information card modal if there is an ' +
    'error while loading an info card', fakeAsync(function() {
    spyOn(learnerViewInfoBackendApiService, 'fetchLearnerInfoAsync')
      .and.returnValue(Promise.reject());
    const modalSpy = spyOn($uibModal, 'open').and.callThrough();

    // First card.
    ctrl.showInformationCard();
    tick();
    $scope.$apply();

    expect(modalSpy).not.toHaveBeenCalled();
  }));
});
