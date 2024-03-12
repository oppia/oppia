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

import {TestBed} from '@angular/core/testing';

import {PlayerTranscriptService} from 'pages/exploration-player-page/services/player-transcript.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {AudioTranslationLanguageService} from 'pages/exploration-player-page/services/audio-translation-language.service';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {LoggerService} from 'services/contextual/logger.service';

describe('Player transcript service', () => {
  let pts: PlayerTranscriptService;
  let atls: AudioTranslationLanguageService;
  let ls: LoggerService;

  beforeEach(() => {
    pts = TestBed.inject(PlayerTranscriptService);
    atls = TestBed.inject(AudioTranslationLanguageService);
    ls = TestBed.inject(LoggerService);
  });

  it('should reset the transcript correctly', () => {
    pts.addNewCard(
      StateCard.createNewCard(
        'First state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    pts.addNewCard(
      StateCard.createNewCard(
        'Second state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );

    expect(pts.getNumCards()).toBe(2);

    pts.init();
    expect(pts.getNumCards()).toBe(0);
    pts.addNewCard(
      StateCard.createNewCard(
        'Third state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    expect(pts.getCard(0).getStateName()).toBe('Third state');
  });

  it('should correctly check whether a state have been encountered before', () => {
    pts.addNewCard(
      StateCard.createNewCard(
        'First state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    pts.addNewCard(
      StateCard.createNewCard(
        'Second state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    pts.addNewCard(
      StateCard.createNewCard(
        'First state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    expect(pts.hasEncounteredStateBefore('First state')).toEqual(true);
    expect(pts.hasEncounteredStateBefore('Third state')).toEqual(false);
  });

  it('should add a new card correctly', () => {
    pts.addNewCard(
      StateCard.createNewCard(
        'First state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );

    let firstCard = pts.getCard(0);
    expect(firstCard.getStateName()).toEqual('First state');
    expect(firstCard.getContentHtml()).toEqual('Content HTML');
    expect(firstCard.getInteractionHtml()).toEqual(
      '<oppia-text-input-html></oppia-text-input-html>'
    );
  });

  it('should add a previous card correctly', () => {
    pts.addNewCard(
      StateCard.createNewCard(
        'First state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    pts.addNewCard(
      StateCard.createNewCard(
        'Second state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    pts.addPreviousCard();

    expect(pts.getNumCards()).toEqual(3);
    expect(pts.getCard(0).getStateName()).toEqual('First state');
    expect(pts.getCard(1).getStateName()).toEqual('Second state');
    expect(pts.getCard(2).getStateName()).toEqual('First state');
  });

  it(
    'should throw error when there is only one card and' +
      'adding previous card fails',
    () => {
      pts.addNewCard(
        StateCard.createNewCard(
          'First state',
          'Content HTML',
          '<oppia-text-input-html></oppia-text-input-html>',
          {} as Interaction,
          {} as RecordedVoiceovers,
          '',
          atls
        )
      );

      expect(() => pts.addPreviousCard()).toThrowError(
        'Exploration player is on the first card and hence no previous ' +
          'card exists.'
      );
    }
  );

  it('should set lastAnswer correctly', () => {
    pts.addNewCard(
      StateCard.createNewCard(
        'First state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    let lastAnswer = pts.getLastAnswerOnDisplayedCard(0);
    expect(lastAnswer).toEqual(null);

    pts.addNewInput('first answer', false);
    pts.addNewCard(
      StateCard.createNewCard(
        'Second state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    lastAnswer = pts.getLastAnswerOnDisplayedCard(0);
    expect(lastAnswer).toEqual('first answer');

    pts.addNewCard(
      StateCard.createNewCard(
        'Third state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    // Variable lastAnswer should be null as no answers were provided in the
    // second state.
    lastAnswer = pts.getLastAnswerOnDisplayedCard(1);
    expect(lastAnswer).toEqual(null);
  });

  it('should record answer/feedback pairs in the correct order', () => {
    pts.addNewCard(
      StateCard.createNewCard(
        'First state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    pts.addNewInput('first answer', false);
    expect(() => {
      pts.addNewInput('invalid answer', false);
    }).toThrowError(
      'Trying to add an input before the response for the previous ' +
        'input has been received.'
    );

    pts.addNewResponse('feedback');
    pts.addNewInput('second answer', false);
    pts.addNewResponse('feedback');
    pts.addNewResponseToExistingFeedback('feedback_2');
    pts.addNewInput('third answer', true);

    let firstCard = pts.getCard(0);
    expect(firstCard.getInputResponsePairs()).toEqual([
      {
        learnerInput: 'first answer',
        oppiaResponse: 'feedback',
        isHint: false,
      },
      {
        learnerInput: 'second answer',
        oppiaResponse: 'feedback\nfeedback_2',
        isHint: false,
      },
      {
        learnerInput: 'third answer',
        oppiaResponse: null,
        isHint: true,
      },
    ]);
    expect(pts.getNumSubmitsForLastCard()).toBe(2);
  });

  it('should retrieve the last card of the transcript correctly', () => {
    pts.addNewCard(
      StateCard.createNewCard(
        'First state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    pts.addNewCard(
      StateCard.createNewCard(
        'Second state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );
    expect(pts.getNumCards()).toBe(2);
    expect(pts.getLastCard().getStateName()).toBe('Second state');
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

  it('should update interaction html of the latest card', () => {
    pts.addNewCard(
      StateCard.createNewCard(
        'First state',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );

    let secondCard = StateCard.createNewCard(
      'Second state',
      'Content HTML',
      '<oppia-number-input-html></oppia-number-input-html>',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    pts.updateLatestInteractionHtml(secondCard.getInteractionHtml());

    expect(pts.getLastCard().getInteractionHtml()).toEqual(
      secondCard.getInteractionHtml()
    );
  });

  it('should restore the old transcript', () => {
    let card1 = StateCard.createNewCard(
      'First State',
      'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    let card2 = StateCard.createNewCard(
      'Second State',
      'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    let card3 = StateCard.createNewCard(
      'Third State',
      'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    let card4 = StateCard.createNewCard(
      'Fourth State',
      'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    let oldTranscript = [card3, card4];

    pts.addNewCard(card1);
    pts.addNewCard(card2);

    expect(pts.getCard(0).getStateName()).toEqual('First State');
    expect(pts.getCard(1).getStateName()).toEqual('Second State');

    pts.restore(oldTranscript);

    expect(pts.getCard(0).getStateName()).toEqual('Third State');
    expect(pts.getCard(1).getStateName()).toEqual('Fourth State');
  });

  it('should restore the old transcript immutably', () => {
    let card1 = StateCard.createNewCard(
      'First State',
      'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    let card2 = StateCard.createNewCard(
      'Second State',
      'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    let card3 = StateCard.createNewCard(
      'Third State',
      'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    let card4 = StateCard.createNewCard(
      'Fourth State',
      'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    let oldTranscript = [card3, card4];

    pts.addNewCard(card1);
    pts.addNewCard(card2);

    expect(pts.getCard(0).getStateName()).toEqual('First State');
    expect(pts.getCard(1).getStateName()).toEqual('Second State');

    pts.restoreImmutably(oldTranscript);

    expect(pts.getCard(0).getStateName()).toEqual('Third State');
    expect(pts.getCard(1).getStateName()).toEqual('Fourth State');
  });

  it('should show error on the console when invalid index is provided', () => {
    spyOn(ls, 'error');

    pts.addNewCard(
      StateCard.createNewCard(
        'First State',
        'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>',
        {} as Interaction,
        {} as RecordedVoiceovers,
        '',
        atls
      )
    );

    pts.getCard(1);

    expect(ls.error).toHaveBeenCalledWith(
      'Requested card with index 1, but transcript only has length 1 cards.'
    );
  });

  it('should find index of latest state', () => {
    let card1 = StateCard.createNewCard(
      'first',
      '',
      '',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    let card2 = StateCard.createNewCard(
      'second',
      '',
      '',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    let card3 = StateCard.createNewCard(
      'third',
      '',
      '',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    let card4 = StateCard.createNewCard(
      'first',
      '',
      '',
      {} as Interaction,
      {} as RecordedVoiceovers,
      '',
      atls
    );

    pts.addNewCard(card1);
    pts.addNewCard(card2);
    pts.addNewCard(card3);
    pts.addNewCard(card4);

    expect(pts.findIndexOfLatestStateWithName('first')).toBe(3);
    expect(pts.findIndexOfLatestStateWithName('second')).toBe(1);
    expect(pts.findIndexOfLatestStateWithName('nonExistent')).toBe(null);
  });
});
