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
 * @fileoverview Unit tests for the Progress nav directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PlayerPositionService } from '../services/player-position.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { EventEmitter } from '@angular/core';
import { StateCard } from 'domain/state_card/state-card.model';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { WrittenTranslationsObjectFactory } from 'domain/exploration/WrittenTranslationsObjectFactory';
import { AudioTranslationLanguageService } from '../services/audio-translation-language.service';
import { BrowserCheckerService } from 'domain/utilities/browser-checker.service';

describe('Progress nav directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let $timeout = null;
  let directive = null;
  let browserCheckerService: BrowserCheckerService = null;
  let playerPositionService: PlayerPositionService = null;
  let playerTranscriptService: PlayerTranscriptService = null;
  let urlService: UrlService = null;
  let windowDimensionsService: WindowDimensionsService = null;
  let writtenTranslationsObjectFactory: WrittenTranslationsObjectFactory = null;
  let interactionObjectFactory: InteractionObjectFactory = null;
  let audioTranslationLanguageService: AudioTranslationLanguageService = null;

  let sampleCard1: StateCard = null;
  let sampleCard2: StateCard = null;
  let interaction1 = null;
  let interaction2 = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  afterEach(function() {
    ctrl.$onDestroy();
  });

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();
    browserCheckerService = $injector.get('BrowserCheckerService');
    playerPositionService = TestBed.inject(PlayerPositionService);
    playerTranscriptService = $injector.get('PlayerTranscriptService');
    urlService = $injector.get('UrlService');
    windowDimensionsService = $injector.get('WindowDimensionsService');
    interactionObjectFactory = $injector.get('InteractionObjectFactory');
    writtenTranslationsObjectFactory = $injector.get(
      'WrittenTranslationsObjectFactory');
    audioTranslationLanguageService = $injector.get(
      'AudioTranslationLanguageService');

    interaction1 = interactionObjectFactory.createFromBackendDict({
      id: 'Continue',
      confirmed_unclassified_answers: [],
      answer_groups: [],
      default_outcome: {
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        dest: 'Mid',
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        missing_prerequisite_skill_id: null
      },
      customization_args: {
        buttonText: {
          value: {
            unicode_str: 'Continue',
            content_id: 'ca_buttonText_0'
          }
        }
      },
      solution: null,
      hints: []
    });

    interaction2 = interactionObjectFactory.createFromBackendDict({
      id: 'MultipleChoiceInput',
      default_outcome: {
        param_changes: [],
        dest: 'correct',
        refresher_exploration_id: null,
        feedback: {
          content_id: 'default_outcome',
          html: '<p>ERROR</p>'
        },
        labelled_as_correct: false,
        missing_prerequisite_skill_id: null
      },
      answer_groups: [
        {
          outcome: {
            param_changes: [],
            dest: 'Pick Limit for Magician',
            refresher_exploration_id: null,
            feedback: {
              content_id: 'feedback_1',
              html: ''
            },
            labelled_as_correct: false,
            missing_prerequisite_skill_id: null
          },
          tagged_skill_misconception_id: null,
          rule_specs: [
            {
              inputs: {
                x: 0
              },
              rule_type: 'Equals'
            }
          ],
          training_data: []
        },
        {
          outcome: {
            param_changes: [],
            dest: 'Discussion Start',
            refresher_exploration_id: null,
            feedback: {
              content_id: 'feedback_2',
              html: ''
            },
            labelled_as_correct: false,
            missing_prerequisite_skill_id: null
          },
          tagged_skill_misconception_id: null,
          rule_specs: [
            {
              inputs: {
                x: 1
              },
              rule_type: 'Equals'
            }
          ],
          training_data: []
        },
        {
          outcome: {
            param_changes: [],
            dest: 'Player Guess Setup',
            refresher_exploration_id: null,
            feedback: {
              content_id: 'feedback_3',
              html: ''
            },
            labelled_as_correct: false,
            missing_prerequisite_skill_id: null
          },
          tagged_skill_misconception_id: null,
          rule_specs: [
            {
              inputs: {
                x: 2
              },
              rule_type: 'Equals'
            }
          ],
          training_data: []
        }
      ],
      confirmed_unclassified_answers: [],
      customization_args: {
        showChoicesInShuffledOrder: {
          value: false
        },
        choices: {
          value: [
            {
              content_id: 'ca_choices_4',
              html: '<p>Let\'s play again</p>'
            },
            {
              content_id: 'ca_choices_5',
              html: '<p>No, not right now.'
            },
            {
              content_id: 'ca_choices_6',
              html: '<p>This time, I want to try guessing!</p>'
            }
          ]
        }
      },
      hints: [],
      solution: null
    });

    sampleCard1 = StateCard.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      interaction1, RecordedVoiceovers.createEmpty(),
      writtenTranslationsObjectFactory.createEmpty(),
      'content', audioTranslationLanguageService);

    sampleCard2 = StateCard.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      interaction2, RecordedVoiceovers.createEmpty(),
      writtenTranslationsObjectFactory.createEmpty(),
      'content', audioTranslationLanguageService);

    spyOn(urlService, 'isIframed').and.returnValue(true);
    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(2);

    directive = $injector.get('progressNavDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });

    $scope.getDisplayedCard = function() {
      return sampleCard1;
    };
  }));

  it('should set properties when initialized', function() {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(playerPositionService, 'onHelpCardAvailable')
      .and.returnValue(mockEventEmitter);
    let helpCard = {
      hasContinueButton: true
    };

    expect($scope.CONTINUE_BUTTON_FOCUS_LABEL).toBe(undefined);
    expect($scope.isIframed).toBe(undefined);
    expect($scope.helpCardHasContinueButton).toBe(undefined);

    ctrl.$onInit();
    $scope.$digest();
    mockEventEmitter.emit(helpCard);
    $scope.$apply();
    $timeout.flush();

    expect($scope.CONTINUE_BUTTON_FOCUS_LABEL).toBe('continueButton');
    expect($scope.isIframed).toBe(true);
    expect($scope.helpCardHasContinueButton).toBe(true);
  });

  it('should check if continue button is shown in the user interface ' +
    'when concept card is being shown', function() {
    $scope.conceptCardIsBeingShown = true;
    $scope.displayedCard = $scope.getDisplayedCard();

    let result = $scope.shouldContinueButtonBeShown();

    expect(result).toBe(true);
  });

  it('should check if continue button is shown in the user interface ' +
    'when concept card is not being shown', function() {
    $scope.displayedCard = $scope.getDisplayedCard();
    $scope.conceptCardIsBeingShown = false;

    let result = $scope.shouldContinueButtonBeShown();

    expect(result).toBe(false);
  });

  it('should check if generic button is shown in the user interface ' +
    'when interactions has special case for mobile', function() {
    spyOn(browserCheckerService, 'isMobileDevice').and.returnValue(true);
    $scope.getDisplayedCard = function() {
      return sampleCard2;
    };
    ctrl.$onInit();
    $scope.$digest();
    $scope.$apply();

    let result = $scope.shouldGenericSubmitButtonBeShown();

    expect(result).toBe(true);
  });

  it('should check if generic button is shown in the user interface ' +
    'when interactions have nav submit button', function() {
    let result = $scope.shouldGenericSubmitButtonBeShown();

    expect(result).toBe(false);
  });

  it('should throw an error if generic button is submitted ' +
    'with invalid interaction id', function() {
    $scope.interactionId = -1;
    expect(() => {
      $scope.shouldGenericSubmitButtonBeShown();
    }).toThrowError('');
  });

  it('should check whether the window can show two cards', function() {
    // Note that threshold width value for two cards to be shown is 960px.
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(961);

    let result = $scope.canWindowShowTwoCards();

    expect(result).toBe(true);
  });

  it('should change card when calling \'changeCard\' if current ' +
    'state has been completed sucessfully', function() {
    spyOn(playerPositionService, 'recordNavigationButtonClick')
      .and.returnValue(null);
    spyOn(playerPositionService, 'setDisplayedCardIndex').and.returnValue(null);
    spyOn(playerPositionService, 'getCurrentStateName')
      .and.returnValue('stateName');
    let changeCardSpy = spyOn(
      playerPositionService, 'changeCurrentQuestion').and.returnValue(null);

    ctrl.$onInit();
    $scope.$digest();
    $scope.changeCard(1);
    $scope.$apply();

    expect(changeCardSpy).toHaveBeenCalled();
  });

  it('should not change card when calling \'changeCard\' if given ' +
    'index is out of bound', function() {
    let changeCardSpy = spyOn(
      playerPositionService, 'changeCurrentQuestion').and.returnValue(null);

    expect(() => {
      $scope.changeCard(-10);
    }).toThrowError('Target card index out of bounds.');

    expect(changeCardSpy).not.toHaveBeenCalled();
  });
});
