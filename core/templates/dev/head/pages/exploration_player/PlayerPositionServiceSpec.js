// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
* @fileoverview Unit tests for the player position service.
*/

describe('Player position service', function() {
  beforeEach(module('oppia'));

  var pts, pps, sof;
  beforeEach(inject(function($injector) {
    pts = $injector.get('PlayerTranscriptService');
    pps = $injector.get('PlayerPositionService');
    scof = $injector.get('StateCardObjectFactory');
  }));

  it('should record answer submission correctly', function() {
    pps.recordAnswerSubmission();
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(true);
  });

  it('should make learner submitted as false when navigation button is clicked',
    function() {
      pps.recordNavigationButtonClick();
      expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(false);
    });

  it('should set display index card to given value', function() {
    callBack = function() {};
    pps.init(callBack);
    pps.setDisplayedCardIndex(4);
    expect(pps.getDisplayedCardIndex()).toBe(4);
  });

  it('should get current state name', function() {
    pts.addNewCard(scof.createNewCard(
      'First state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    callBack = function() {};
    pps.init(callBack);
    pps.setDisplayedCardIndex(0);
    expect(pps.getCurrentStateName()).toBe('First state');
  });

  it('should not change index if its same as previous', function() {
    callBack = function() {};
    pps.init(callBack);
    pps.setDisplayedCardIndex(4);
    pps.setDisplayedCardIndex(4);
    expect(pps.getDisplayedCardIndex()).toBe(4);
  });
});
