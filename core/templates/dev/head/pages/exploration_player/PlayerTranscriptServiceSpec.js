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
    pts = $injector.get('PlayerTranscriptService');
  }));

  it('should reset the transcript correctly', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    pts.addNewCard('Second state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);

    expect(pts.getNumCards()).toBe(2);

    pts.init();
    expect(pts.getNumCards()).toBe(0);
    pts.addNewCard('Third state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    expect(pts.getCard(0).stateName).toBe('Third state');
  });

  it('should compute the state history correctly', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    pts.addNewCard('Second state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    expect(pts.getStateHistory()).toEqual([
      'First state', 'Second state', 'First state']);
  });

  it('should add a new card correctly', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);

    var firstCard = pts.getCard(0);
    expect(firstCard).toEqual({
      stateName: 'First state',
      currentParams: {
        a: 'b'
      },
      contentHtml: 'Content HTML',
      interactionHtml: '<oppia-text-input-html></oppia-text-input-html>',
      inputResponsePairs: [],
      destStateName: null,
      leadsToConceptCard: false
    });
  });

  it('should add a previous card correctly', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    pts.addNewCard('Second state', {
      a: 'b'
    }, 'Content HTML 2', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    pts.addPreviousCard();

    expect(pts.getNumCards()).toEqual(3);
    expect(pts.getCard([0])).toEqual({
      stateName: 'First state',
      currentParams: {
        a: 'b'
      },
      contentHtml: 'Content HTML',
      interactionHtml: '<oppia-text-input-html></oppia-text-input-html>',
      inputResponsePairs: [],
      destStateName: null,
      leadsToConceptCard: false
    });
    expect(pts.getCard([1])).toEqual({
      stateName: 'Second state',
      currentParams: {
        a: 'b'
      },
      contentHtml: 'Content HTML 2',
      interactionHtml: '<oppia-text-input-html></oppia-text-input-html>',
      inputResponsePairs: [],
      destStateName: null,
      leadsToConceptCard: false
    });
    expect(pts.getCard([2])).toEqual({
      stateName: 'First state',
      currentParams: {
        a: 'b'
      },
      contentHtml: 'Content HTML',
      interactionHtml: '<oppia-text-input-html></oppia-text-input-html>',
      inputResponsePairs: [],
      destStateName: null,
      leadsToConceptCard: false
    });
  });

  it('should set lastAnswer correctly', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    var lastAnswer = pts.getLastAnswerOnActiveCard(0);
    expect(lastAnswer).toEqual(null);

    pts.addNewInput('first answer', false);
    pts.addNewCard('Second state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    lastAnswer = pts.getLastAnswerOnActiveCard(0);
    expect(lastAnswer).toEqual('first answer');
  });

  it('should record answer/feedback pairs in the correct order', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    pts.addNewInput('first answer', false);
    expect(function() {
      pts.addNewInput('invalid answer');
    }).toThrow(
      new Error(
        'Trying to add an input before the response for the previous ' +
        'input has been received.'));

    pts.addNewResponse('feedback');
    expect(function() {
      pts.addNewResponse('invalid feedback');
    }).toThrow(
      new Error('Trying to add a response when it has already been added.'));

    pts.addNewInput('second answer', true);

    var firstCard = pts.getCard(0);
    expect(firstCard.inputResponsePairs).toEqual([{
      learnerInput: 'first answer',
      oppiaResponse: 'feedback',
      isHint: false
    }, {
      learnerInput: 'second answer',
      oppiaResponse: null,
      isHint: true
    }]);
    expect(pts.getNumSubmitsForLastCard()).toBe(1);
  });

  it('should set a destination name correctly', function() {
    pts.addNewCard('First state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
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
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    pts.addNewCard('Second state', {
      a: 'b'
    }, 'Content HTML', '<oppia-text-input-html></oppia-text-input-html>',
    false);
    expect(pts.getNumCards()).toBe(2);
    expect(pts.getLastCard().stateName).toBe('Second state');
    expect(pts.isLastCard(0)).toBe(false);
    expect(pts.isLastCard(1)).toBe(true);
    expect(pts.isLastCard(2)).toBe(false);
    expect(pts.getLastStateName()).toBe('Second state');

    expect(pts.getNumSubmitsForLastCard()).toBe(0);
    pts.addNewInput('first answer', false);
    expect(pts.getNumSubmitsForLastCard()).toBe(1);
    pts.addNewResponse('first feedback');
    expect(pts.getNumSubmitsForLastCard()).toBe(1);
    pts.addNewInput('second answer', false);
    expect(pts.getNumSubmitsForLastCard()).toBe(2);
  });
});
