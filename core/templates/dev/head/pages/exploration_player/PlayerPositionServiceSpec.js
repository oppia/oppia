// Copyright 2019 The Oppia Authors. All Rights Reserved.
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

  var pts = null;
  var pps = null;
  var scof = null;
  beforeEach(inject(function($injector) {
    pts = $injector.get('PlayerTranscriptService');
    pps = $injector.get('PlayerPositionService');
    scof = $injector.get('StateCardObjectFactory');
  }));

  it('should record answer submission as true', function() {
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(false);
    pps.recordAnswerSubmission();
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(true);
  });

  it('should record answer submission by the learner as false', function() {
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(false);
    pps.recordAnswerSubmission();
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(true);
    pps.recordNavigationButtonClick();
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(false);
  });

  it('should set displayed index card to given value', function() {
    var callBack = function() {};
    expect(pps.getDisplayedCardIndex()).toBe(null);
    pps.init(callBack);
    pps.setDisplayedCardIndex(4);
    expect(pps.getDisplayedCardIndex()).toBe(4);
  });

  it('should get current state name', function() {
    pts.addNewCard(scof.createNewCard(
      'First state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    pts.addNewCard(scof.createNewCard(
      'Second state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    var callBack = function() {};
    pps.init(callBack);
    pps.setDisplayedCardIndex(0);
    expect(pps.getCurrentStateName()).toBe('First state');
    pps.setDisplayedCardIndex(1);
    expect(pps.getCurrentStateName()).toBe('Second state');
  });

  it('should not change displayed card index if it is the same as the' +
     'previously displayed card index', function() {
    var callBack = function() {};
    expect(pps.getDisplayedCardIndex()).toBe(null);
    pps.init(callBack);
    pps.setDisplayedCardIndex(4);
    pps.setDisplayedCardIndex(4);
    expect(pps.getDisplayedCardIndex()).toBe(4);
    pps.setDisplayedCardIndex(5);
    expect(pps.getDisplayedCardIndex()).toBe(5);
  });
});
