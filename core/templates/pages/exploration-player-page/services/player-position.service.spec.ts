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

import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Subscription } from 'rxjs';

import { PlayerPositionService } from
  'pages/exploration-player-page/services/player-position.service';
import { PlayerTranscriptService } from
  'pages/exploration-player-page/services/player-transcript.service';
import { StateCardObjectFactory } from
  'domain/state_card/StateCardObjectFactory';

describe('Player position service', () => {
  let pts = null;
  let pps: PlayerPositionService = null;
  let scof = null;
  let onQuestionChangeSpy: jasmine.Spy;
  let subscriptions: Subscription;

  beforeEach(() => {
    pts = TestBed.get(PlayerTranscriptService);
    pps = TestBed.get(PlayerPositionService);
    scof = TestBed.get(StateCardObjectFactory);
    onQuestionChangeSpy = jasmine.createSpy('onQuestionChangeSpy');
    subscriptions = new Subscription();
    subscriptions.add(pps.onCurrentQuestionChange.subscribe(
      onQuestionChangeSpy));
  });

  afterEach(() => {
    subscriptions.unsubscribe();
  });

  it('should record answer submission as true', () => {
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(false);
    pps.recordAnswerSubmission();
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(true);
  });

  it('should record answer submission by the learner as false', () => {
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(false);
    pps.recordAnswerSubmission();
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(true);
    pps.recordNavigationButtonClick();
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(false);
  });

  it('should set displayed index card to given value', () => {
    let callBack = () => {};
    expect(pps.getDisplayedCardIndex()).toBe(null);
    pps.init(callBack);
    pps.setDisplayedCardIndex(4);
    expect(pps.getDisplayedCardIndex()).toBe(4);
  });

  it('should get current state name', () => {
    pts.addNewCard(scof.createNewCard(
      'First state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    pts.addNewCard(scof.createNewCard(
      'Second state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    let callBack = () => {};
    pps.init(callBack);
    pps.setDisplayedCardIndex(0);
    expect(pps.getCurrentStateName()).toBe('First state');
    pps.setDisplayedCardIndex(1);
    expect(pps.getCurrentStateName()).toBe('Second state');
  });

  it('should not change displayed card index if it is the same as the' +
     'previously displayed card index', () => {
    let callBack = () => {};
    expect(pps.getDisplayedCardIndex()).toBe(null);
    pps.init(callBack);
    pps.setDisplayedCardIndex(4);
    pps.setDisplayedCardIndex(4);
    expect(pps.getDisplayedCardIndex()).toBe(4);
    pps.setDisplayedCardIndex(5);
    expect(pps.getDisplayedCardIndex()).toBe(5);
  });

  it('should get onNewCardOpened EventEmitter', () => {
    let mockNewCardOpenedEventEmitter = new EventEmitter();
    expect(pps.onNewCardOpened).toEqual(mockNewCardOpenedEventEmitter);
  });

  it('should emit the index of the question change', () => {
    pps.changeCurrentQuestion(3);
    expect(onQuestionChangeSpy).toHaveBeenCalledWith(3);
  });

  it('should fetch EventEmitter for changing active card', () => {
    let mockActiveCardChangedEvent = new EventEmitter();
    expect(pps.onActiveCardChanged).toEqual(mockActiveCardChangedEvent);
  });

  it('should fetch EventEmitter when help card is available', () => {
    let mockHelpCardAvailableEvent = new EventEmitter();
    expect(pps.onHelpCardAvailable).toEqual(mockHelpCardAvailableEvent);
  });
});
