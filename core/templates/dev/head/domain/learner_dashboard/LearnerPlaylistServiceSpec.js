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
  var activityType = constants.ACTIVITY_TYPE_EXPLORATION;
  var activityId = 'activity_1';
  var addToLearnerPlaylistUrl = '/learnerplaylistactivityhandler' 
    + activityType + '/' + activityId;
  var mockAlertsService = null;
  var spyInfoMessage = null;
  var spySuccessMessage = null;

  beforeEach(module('oppia'));

  beforeEach(function(){
    mockAlertsService = {
      addInfoMessage: function(message) {},
      addSuccessMessage: function(message) {}
    };
    module(function($provide) {
      $provide.value(
        'AlertsService', mockAlertsService);
    });
    spyOn(mockAlertsService, 'addInfoMessage').and.callThrough();
    spyOn(mockAlertsService, 'addSuccessMessage').and.callThrough();
  })
  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    LearnerPlaylistService = $injector.get(
      'LearnerPlaylistService');
    
  }));

  it('should successfully add playlist to play later list', function(){
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };

    $httpBackend.expect('POST', addToLearnerPlaylistUrl, {}).respond({
      data: response
    });

    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);
    $httpBackend.flush();
    expect(AlertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Successfully added to your \'Play Later\' list.');
    expect(AlertsService.addInfoMessage).not.toHaveBeenCalled();
  });

});
