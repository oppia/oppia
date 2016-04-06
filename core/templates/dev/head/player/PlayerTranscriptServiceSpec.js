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
 * @fileoverview Unit tests for the player transcript service.
 */

describe('Player transcript service', function() {
  beforeEach(module('oppia'));

  var pts;
  beforeEach(inject(function($injector) {
    pts = $injector.get('playerTranscriptService');
  }));

  it('should reset the transcript correctly', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>');
    pts.addNewCard('Second state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>');

    expect(pts.getNumCards()).toBe(2);

    pts.init();
    expect(pts.getNumCards()).toBe(0);
    pts.addNewCard('Third state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>');
    expect(pts.getCard(0).stateName).toBe('Third state');
  });

  it('should compute the state history correctly', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>');
    pts.addNewCard('Second state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>');
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>');
    expect(pts.getStateHistory()).toEqual([
      'First state', 'Second state', 'First state']);
  });

  it('should add a new card correctly', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>');

    var firstCard = pts.getCard(0);
    expect(firstCard).toEqual({
      stateName: 'First state',
      currentParams: {
        a: 'b'
      },
      contentHtml: 'Content HTML',
      interactionHtml: '<oppia-text-input-html></oppia-text-input-html>',
      answerFeedbackPairs: [],
      destStateName: null
    });
  });

  it('should record answer/feedback pairs in the correct order', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>');
    pts.addNewAnswer('first answer');
    expect(function() {
      pts.addNewAnswer('invalid answer');
    }).toThrow(
      new Error(
        'Trying to add an answer before the feedback for the previous answer ' +
        'has been received.'));

    pts.addNewFeedback('feedback');
    expect(function() {
      pts.addNewFeedback('invalid feedback');
    }).toThrow(
      new Error('Trying to add feedback when it has already been added.'));

    pts.addNewAnswer('second answer', null);

    var firstCard = pts.getCard(0);
    expect(firstCard.answerFeedbackPairs).toEqual([{
      learnerAnswer: 'first answer',
      oppiaFeedbackHtml: 'feedback'
    }, {
      learnerAnswer: 'second answer',
      oppiaFeedbackHtml: null
    }]);
  });

  it('should set a destination name correctly', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>');
    expect(pts.getCard(0).destStateName).toBeNull();
    pts.setDestination('New destination');
    expect(pts.getCard(0).destStateName).toBe('New destination');
    expect(function() {
      pts.setDestination('Invalid new destination');
    }).toThrow(
      new Error('Trying to set a destStateName when it has already been set.'));
  });

  it('should retrieve the last card of the transcript correctly', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>');
    pts.addNewCard('Second state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>');
    expect(pts.getNumCards()).toBe(2);
    expect(pts.getLastCard().stateName).toBe('Second state');
    expect(pts.isLastCard(0)).toBe(false);
    expect(pts.isLastCard(1)).toBe(true);
    expect(pts.isLastCard(2)).toBe(false);
    expect(pts.getLastStateName()).toBe('Second state');

    expect(pts.getNumSubmitsForLastCard()).toBe(0);
    pts.addNewAnswer('first answer', null);
    expect(pts.getNumSubmitsForLastCard()).toBe(1);
    pts.addNewFeedback('first feedback');
    expect(pts.getNumSubmitsForLastCard()).toBe(1);
    pts.addNewAnswer('second answer', null);
    expect(pts.getNumSubmitsForLastCard()).toBe(2);
  });
});
