// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for moderatorPage.
 */
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';

require('pages/moderator-page/moderator-page.component.ts');

describe('Moderator Page', function() {
  var ctrl = null;

  var $httpBackend = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var loadingMessage = null;
  var AlertsService = null;
  var CsrfService = null;
  var LoaderService = null;
  var subscriptions = [];

  var activityReferences = [
    { type: 'exploration', id: 1 },
    { type: 'exploration', id: 2 }
  ];
  var commitsResults = ['commit1', 'commit2'];
  var explorationIdsToExplorationData = {
    0: 'exploration1',
    1: 'exploration2',
    2: 'exploration3'
  };
  var feedbackMessages = [
    { message_id: 1, text: 'Feedback 1' },
    { message_id: 2, text: 'Feedback 2' }
  ];

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('DateTimeFormatService', {
      getLocaleAbbreviatedDatetimeString: () => '11/21/14'
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    AlertsService = $injector.get('AlertsService');
    CsrfService = $injector.get('CsrfTokenService');
    loadingMessage = '';
    LoaderService = $injector.get('LoaderService');
    subscriptions.push(LoaderService.onLoadingMessageChange.subscribe(
      (message: string) => loadingMessage = message
    ));
    spyOn(CsrfService, 'getTokenAsync')
      .and.returnValue($q.resolve('sample-csrf-token'));

    $scope = $rootScope.$new();
    ctrl = $componentController('moderatorPage', {
      $scope: $scope
    });
  }));

  afterEach(function() {
    for (let subscription of subscriptions) {
      subscription.unsubscribe();
    }
  });

  it('should get date time as string', function() {
    // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
    var NOW_MILLIS = 1416563100000;
    expect(ctrl.getDatetimeAsString(NOW_MILLIS)).toEqual('11/21/14');
  });

  it('should get exploration create url', function() {
    expect(ctrl.getExplorationCreateUrl('1')).toEqual('/create/1');
  });

  it('should get activity create url for exploration', function() {
    var reference = { type: 'exploration', id: 1 };
    expect(ctrl.getActivityCreateUrl(reference)).toEqual('/create/1');
  });

  it('should get activity create url for collection', function() {
    var reference = { type: 'collection', id: 1 };
    expect(ctrl.getActivityCreateUrl(reference))
      .toEqual('/create_collection/1');
  });

  it('should call http request when calling onInit', function() {
    $httpBackend.expectGET(
      '/recentcommitshandler/recent_commits?query_type=all_non_private_commits')
      .respond({
        exp_ids_to_exp_data: explorationIdsToExplorationData,
        results: commitsResults
      });
    $httpBackend.expectGET('/recent_feedback_messages').respond({
      results: feedbackMessages
    });
    $httpBackend.expectGET('/moderatorhandler/featured').respond({
      featured_activity_references: activityReferences
    });

    ctrl.$onInit();
    expect(loadingMessage).toEqual('Loading');
    $httpBackend.flush(3);

    expect(loadingMessage).toEqual('');
    expect(ctrl.explorationData).toEqual(explorationIdsToExplorationData);
    expect(ctrl.allCommits).toEqual(commitsResults);
    expect(ctrl.allFeedbackMessages.length).toEqual(2);
    expect(ctrl.allFeedbackMessages[0].text).toEqual('Feedback 1');
    expect(ctrl.allFeedbackMessages[1].text).toEqual('Feedback 2');
    expect(ctrl.allFeedbackMessages[0].messageId).toEqual(1);
    expect(ctrl.allFeedbackMessages[1].messageId).toEqual(2);
    expect(ctrl.displayedFeaturedActivityReferences)
      .toEqual(activityReferences);
    expect(ctrl.lastSavedFeaturedActivityReferences)
      .toEqual(activityReferences);
  });

  it('should handler when http request fails when calling onInit', function() {
    $httpBackend.expectGET(
      '/recentcommitshandler/recent_commits?query_type=all_non_private_commits')
      .respond(500);
    $httpBackend.expectGET('/recent_feedback_messages').respond(500);
    $httpBackend.expectGET('/moderatorhandler/featured').respond(500);

    ctrl.$onInit();
    expect(loadingMessage).toEqual('Loading');
    $httpBackend.flush(3);

    expect(loadingMessage).toEqual('Loading');
    expect(ctrl.explorationData).toEqual({});
    expect(ctrl.allCommits).toEqual([]);
    expect(ctrl.allFeedbackMessages).toEqual([]);
    expect(ctrl.displayedFeaturedActivityReferences).toEqual([]);
    expect(ctrl.lastSavedFeaturedActivityReferences).toEqual([]);
  });

  it('should save new featured activity references', function() {
    $httpBackend.expectGET(
      '/recentcommitshandler/recent_commits?query_type=all_non_private_commits')
      .respond({
        exp_ids_to_exp_data: explorationIdsToExplorationData,
        results: commitsResults
      });
    $httpBackend.expectGET('/recent_feedback_messages').respond({
      results: feedbackMessages
    });
    $httpBackend.expectGET('/moderatorhandler/featured').respond({
      featured_activity_references: activityReferences
    });

    var addSuccessMessageSpy = spyOn(AlertsService, 'addSuccessMessage')
      .and.callThrough();
    ctrl.$onInit();
    $httpBackend.flush(3);

    expect(ctrl.displayedFeaturedActivityReferences)
      .toEqual(activityReferences);
    expect(ctrl.lastSavedFeaturedActivityReferences)
      .toEqual(activityReferences);

    var newReference = { type: 'exploration', id: 3 };
    ctrl.displayedFeaturedActivityReferences.push(newReference);
    expect(ctrl.isSaveFeaturedActivitiesButtonDisabled()).toBe(false);

    $httpBackend.expectPOST('/moderatorhandler/featured').respond(200);
    ctrl.saveFeaturedActivityReferences();
    $httpBackend.flush();

    expect(ctrl.displayedFeaturedActivityReferences)
      .toEqual(activityReferences.concat([newReference]));
    expect(ctrl.lastSavedFeaturedActivityReferences)
      .toEqual(activityReferences.concat([newReference]));
    expect(ctrl.isSaveFeaturedActivitiesButtonDisabled()).toBe(true);
    expect(addSuccessMessageSpy)
      .toHaveBeenCalledWith('Featured activities saved.');
  });
});
