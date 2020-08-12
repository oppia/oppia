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
 * @fileoverview Unit tests for ExplorationPlayerSuggestionModalController.
 */

import { TestBed } from '@angular/core/testing';
import { SuggestionModalService } from 'services/suggestion-modal.service';
import { InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { StateCardObjectFactory } from
  'domain/state_card/StateCardObjectFactory';
import { PlayerPositionService } from '../services/player-position.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';

describe('Exploration Player Suggestion Modal Controller', function() {
  var $scope = null;
  var $timeout = null;
  var $uibModalInstance = null;
  var ContextService = null;
  var ExplorationEngineService = null;
  var interactionObjectFactory = null;
  var playerPositionService = null;
  var playerTranscriptService = null;
  var recordedVoiceoversObjectFactory = null;
  var stateCardObjectFactory = null;
  var suggestionModalService = null;

  var card = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    interactionObjectFactory = TestBed.get(InteractionObjectFactory);
    playerPositionService = TestBed.get(PlayerPositionService);
    playerTranscriptService = TestBed.get(PlayerTranscriptService);
    recordedVoiceoversObjectFactory = TestBed.get(
      RecordedVoiceoversObjectFactory);
    stateCardObjectFactory = TestBed.get(StateCardObjectFactory);
    suggestionModalService = TestBed.get(SuggestionModalService);
  });

  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    ContextService = $injector.get('ContextService');
    spyOn(ContextService, 'getExplorationId').and.returnValue('exp1');

    ExplorationEngineService = $injector.get('ExplorationEngineService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    var interaction = interactionObjectFactory.createFromBackendDict({
      answer_groups: [],
      confirmed_unclassified_answers: [],
      customization_args: {},
      hints: [],
      id: null
    });

    var recordedVoiceovers = recordedVoiceoversObjectFactory.createEmpty();

    card = stateCardObjectFactory.createNewCard(
      'Card 1', 'Content html', 'Interaction text', interaction,
      recordedVoiceovers, 'content_id');

    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'Introduction');
    spyOn(playerTranscriptService, 'getCard').and.returnValue(card);

    $scope = $rootScope.$new();
    $controller('ExplorationPlayerSuggestionModalController', {
      $scope: $scope,
      PlayerPositionService: playerPositionService,
      PlayerTranscriptService: playerTranscriptService,
      SuggestionModalService: suggestionModalService,
      $uibModalInstance: $uibModalInstance
    });
  }));

  it('should evaluate initialized properties', function() {
    expect($scope.originalHtml).toBe('Content html');
    expect($scope.description).toBe('');
    expect($scope.suggestionData).toEqual({
      suggestionHtml: 'Content html'
    });
    expect($scope.showEditor).toBe(false);
  });

  it('should show editor after 500 milliseconds', function() {
    expect($scope.showEditor).toBe(false);
    $timeout.flush(500);
    expect($scope.showEditor).toBe(true);
  });

  it('should cancel suggestion', function() {
    spyOn(suggestionModalService, 'cancelSuggestion').and.callThrough();
    $scope.cancelSuggestion();

    expect(suggestionModalService.cancelSuggestion).toHaveBeenCalledWith(
      $uibModalInstance);
  });

  it('should submit suggestion', function() {
    spyOn(ExplorationEngineService, 'getExplorationId').and.returnValue('exp1');
    spyOn(ExplorationEngineService, 'getExplorationVersion').and.returnValue(
      '1');

    $scope.submitSuggestion();

    expect($uibModalInstance.close).toHaveBeenCalledWith({
      target_id: 'exp1',
      version: '1',
      stateName: 'Introduction',
      suggestion_type: 'edit_exploration_state_content',
      target_type: 'exploration',
      description: '',
      suggestionHtml: 'Content html',
    });
  });
});
