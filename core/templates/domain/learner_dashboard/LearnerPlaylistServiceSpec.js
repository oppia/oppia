// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for LearnerPlaylistService.js.
 */

describe('Learner playlist service factory', function() {
  var LearnerPlaylistService = null;
  var $httpBackend = null;
  var $rootScope = null;
  var activityType = constants.ACTIVITY_TYPE_EXPLORATION;
  var UrlInterpolationService = null;
  var activityId = '1';
  var addToLearnerPlaylistUrl = '';
  var AlertsService = null;
  var spyInfoMessage = null;
  var spySuccessMessage = null;

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    LearnerPlaylistService = $injector.get(
      'LearnerPlaylistService');
    $rootScope = $injector.get('$rootScope');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    AlertsService = $injector.get('AlertsService');
    spyOn(AlertsService, 'addInfoMessage').and.callThrough();
    spyOn(AlertsService, 'addSuccessMessage').and.callThrough();
  }));

  beforeEach(function() {
    addToLearnerPlaylistUrl = (
      UrlInterpolationService.interpolateUrl(
        '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
          activityType: activityType,
          activityId: activityId
        }));
  });
  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully add playlist to play later list', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Successfully added to your \'Play Later\' list.');
    expect(AlertsService.addInfoMessage).not.toHaveBeenCalled();
  });

  it('should not add playlist to play later list' +
    'and show belongs to completed or incomplete list', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: true,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'You have already completed or are completing this activity.');
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  });

  it('should not add playlist to play later list' +
    'and show belongs to subscribed activities', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: true,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'This is present in your creator dashboard');
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  });

  it('should not add playlist to play later list' +
    'and show playlist limit exceeded', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: true
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'Your \'Play Later\' list is full!  Either you can ' +
      'complete some or you can head to the learner dashboard ' +
      'and remove some.');
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  });
});
