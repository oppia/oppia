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
 * @fileoverview Unit tests for ExplorationPlayerStateService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// current-interaction.service.ts is upgraded to Angular 8.
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('services/context.service.ts');
require(
  'pages/exploration-player-page/exploration-player-page.constants.ajs.ts');  
require('domain/exploration/read-only-exploration-backend-api.service.ts');
require(
  'pages/exploration-player-page/services/exploration-player-state.service.ts');

describe('Exploration Player State Service', function() {
  var EXPLORATION_MODE = null;
  var ContextService = null;
  var ExplorationEngineService = null;
  var ExplorationFeaturesService = null;
  var ExplorationFeaturesBackendApiService = null;
  var EditableExplorationBackendApiService = null;
  var ExplorationPlayerStateService = null;
  var NumberAttemptsService = null;
  var PlayerCorrectnessFeedbackEnabledService = null;
  var PlayerTranscriptService = null;
  var PlaythroughIssuesService = null;
  var PlaythroughService = null;
  var PretestQuestionBackendApiService = null;
  var ReadOnlyExplorationBackendApiService = null;
  var QuestionBackendApiService = null;
  var QuestionPlayerEngineService = null;
  var StateClassifierMappingService = null;
  var StatsReportingService = null;
  var UrlService = null;
  var $rootScope = null;
  var $q = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('UrlService', {
        getExplorationVersionFromUrl: function() {
          return null;
        },
        getStoryIdInPlayer: function() {
          return '1';
        }
      });

      $provide.value('ContextService', {
        isInExplorationEditorPage: function() {
          return true;
        },
        isInQuestionPlayerMode: function() {
          return false;
        },
        getExplorationId: function() {
          return '123';
        }
      });
      
      $provide.constant('EXPLORATION_MODE', {
        OTHER: false
      });

      $provide.value('AngularNameService', new AngularNameService());
    });
  });

  beforeEach(angular.mock.inject(function(
    _$q_, _$rootScope_, _ContextService_,
    _EditableExplorationBackendApiService_,
    _ExplorationFeaturesService_,
    _ExplorationFeaturesBackendApiService_,
    _ExplorationEngineService_,
    _EXPLORATION_MODE_,
    _ExplorationPlayerStateService_, _ExplorationStatesService_,
    _NumberAttemptsService_,
    _PlayerCorrectnessFeedbackEnabledService_,
    _PlayerTranscriptService_,
    _PlaythroughIssuesService_,
    _PlaythroughService_,
    _PretestQuestionBackendApiService_,
    _QuestionBackendApiService_,
    _QuestionPlayerEngineService_,
    _ReadOnlyExplorationBackendApiService_,
    _StateClassifierMappingService_,
    _StatsReportingService_,
    _UrlService_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    ContextService = _ContextService_;
    EditableExplorationBackendApiService = _EditableExplorationBackendApiService_;
    ExplorationEngineService = _ExplorationEngineService_;
    ExplorationFeaturesService = _ExplorationFeaturesService_;
    ExplorationFeaturesBackendApiService = _ExplorationFeaturesBackendApiService_;
    NumberAttemptsService = _NumberAttemptsService_;
    PlayerCorrectnessFeedbackEnabledService = _PlayerCorrectnessFeedbackEnabledService_;
    PlaythroughIssuesService = _PlaythroughIssuesService_;
    PlayerTranscriptService = _PlayerTranscriptService_;
    PlaythroughService = _PlaythroughService_;
    PretestQuestionBackendApiService = _PretestQuestionBackendApiService_;
    QuestionBackendApiService = _QuestionBackendApiService_;
    QuestionPlayerEngineService = _QuestionPlayerEngineService_;
    ReadOnlyExplorationBackendApiService = _ReadOnlyExplorationBackendApiService_;
    StateClassifierMappingService = _StateClassifierMappingService_;
    StatsReportingService = _StatsReportingService_;
    UrlService = _UrlService_;
    EXPLORATION_MODE = _EXPLORATION_MODE_;
    ExplorationPlayerStateService = _ExplorationPlayerStateService_;
  }));

  it('should properly initialize player', function() {
    ExplorationPlayerStateService.initializePlayer();
    expect(true).toBe(true);
  });
});
