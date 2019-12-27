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
// exploration-player-state.service.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'pages/exploration-player-page/services/exploration-player-state.service.ts');

describe('Exploration Player State Service', () => {
  let ExplorationEngineService = null;
  let ExplorationPlayerStateService = null;
  let PlaythroughIssuesService = null;
  let PlaythroughService = null;
  let StatsReportingService = null;
  let ReadOnlyExplorationBackendApiService = null;
  let $rootScope = null;
  let $q = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', ($provide) => {
    let ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(() => {
    angular.mock.module(($provide) => {
      $provide.value('UrlService', {
        getCollectionIdFromExplorationUrl: () => {
          return '';
        },
        getExplorationVersionFromUrl: () => {
          return null;
        },
        getStoryIdInPlayer: () => {
          return '1';
        },
        getUrlParams: () => {
          return {};
        }
      });
      $provide.value('ContextService', {
        isInExplorationEditorPage: () => {
          return false;
        },
        isInQuestionPlayerMode: () => {
          return true;
        },
        getExplorationId: () => {
          return '123';
        }
      });
      $provide.constant('EXPLORATION_MODE', {
        OTHER: false
      });
      $provide.factory(
        'ReadOnlyExplorationBackendApiService', ['$q', ($q) => {
          return {
            loadExploration: () => {
              return $q.resolve();
            },
            loadLatestExploration: () => {
              return $q.resolve();
            }
          };
        }]);
      $provide.value('StatsReportingService', {
        initSession: $.noop
      });
      $provide.value('StateClassifierMappingService', {
        init: $.noop
      });
      $provide.value('QuestionPlayerEngineService', {});
      $provide.value('QuestionBackendApiService', {});
      $provide.value('PretestQuestionBackendApiService', {
        fetchPretestQuestions: $.noop
      });
      $provide.value('PlaythroughService', {
        initSession: $.noop
      });
      $provide.value('PlayerTranscriptService', {
        init: $.noop
      });
      $provide.value('PlaythroughIssuesService', {
        initSession: $.noop
      });
      $provide.value('PlayerCorrectnessFeedbackEnabledService', {
        init: $.noop
      });
      $provide.value('NumberAttemptsService', {});
      $provide.value('ExplorationFeaturesBackendApiService', {
        fetchExplorationFeatures: $.noop
      });
      $provide.value('ExplorationFeaturesService', {
        init: $.noop
      });
      $provide.value('ExplorationEngineService', {
        init: $.noop
      });
      $provide.value('EditableExplorationBackendApiService', {});
    });
  });

  beforeEach(angular.mock.inject((
      _$rootScope_, _$q_,
      _ExplorationEngineService_,
      _ExplorationPlayerStateService_,
      _PlaythroughIssuesService_,
      _PlaythroughService_,
      _ReadOnlyExplorationBackendApiService_,
      _StatsReportingService_) => {
    $rootScope = _$rootScope_;
    $q = _$q_;
    ExplorationEngineService = _ExplorationEngineService_;
    StatsReportingService = _StatsReportingService_;
    PlaythroughIssuesService = _PlaythroughIssuesService_;
    PlaythroughService = _PlaythroughService_;
    ReadOnlyExplorationBackendApiService = (
      _ReadOnlyExplorationBackendApiService_);
    ExplorationPlayerStateService = _ExplorationPlayerStateService_;
  }));

  it('should properly initialize player', (done) => {
    let deferred = $q.defer();
    deferred.resolve([{
      version: 1,
      exploration: {
        title: 'exploration title'
      },
      session_id: '123'
    }, {}, {}]);
    spyOn($q, 'all').and.returnValue(deferred.promise);
    spyOn(StatsReportingService, 'initSession').and.callFake((
        explorationId, title, version, sessionId, collectionId) => {
      expect(version).toEqual(1);
    });
    spyOn(PlaythroughService, 'initSession').and.callFake((
        explorationId, version, recordPlaythroughProbability) => {
      expect(version).toEqual(1);
    });
    spyOn(PlaythroughIssuesService, 'initSession').and.callFake((
        explorationId, version) => {
      expect(version).toEqual(1);
    });
    spyOn(ExplorationEngineService, 'init').and.callFake((
        exploration, version, preferredAudioLanguageCode,
        autoTtsEnabled, callback) => {
      expect(version).toEqual(1);
      callback();
    });
    ExplorationPlayerStateService.initializePlayer(() => done());
    $rootScope.$apply();
  });
});
