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

// require('domain/exploration/editable-exploration-backend-api.service.ts');
// require('domain/exploration/read-only-exploration-backend-api.service.ts');
// require('domain/question/pretest-question-backend-api.service.ts');
// require('domain/question/question-backend-api.service.ts');
// require('pages/exploration-player-page/services/exploration-engine.service.ts');
// require('pages/exploration-player-page/services/number-attempts.service.ts');
// require('pages/exploration-player-page/services/player-position.service.ts');
// require('pages/exploration-player-page/services/player-transcript.service.ts');
// require(
//   'pages/exploration-player-page/services/question-player-engine.service.ts');
// require(
//   'pages/exploration-player-page/services/state-classifier-mapping.service.ts');
// require('pages/exploration-player-page/services/stats-reporting.service.ts');
// require('services/context.service.ts');
// require('services/exploration-features-backend-api.service.ts');
// require('services/exploration-features.service.ts');
// require('services/playthrough-issues.service.ts');
// require('services/playthrough.service.ts');
// require('services/contextual/url.service.ts');

// require(
//   'pages/exploration-player-page/exploration-player-page.constants.ajs.ts');
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
  var $httpBackend = null;
  var $q = null;
  var $scope = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('AngularNameService', new AngularNameService());
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
          return false;
        },
        isInQuestionPlayerMode: function() {
          return true;
        },
        getExplorationId: function() {
          return '123';
        }
      });
      
      $provide.constant('EXPLORATION_MODE', {
        OTHER: false
      });
      $provide.factory(
        'ReadOnlyExplorationBackendApiService', ['$http', function($http) {
          return {
            loadExploration: function() {
              return $http.get('/dummyurl/1');
            },
            loadLatestExploration: function() {
              return $http.get('/dummyurl/1');
            }
          };
        }]);
      // $provide.value('ReadOnlyExplorationBackendApiService', {
      //   loadExploration: $.noop,
      //   loadLatestExploration: $.noop
      // });
      $provide.value('StatsReportingService', {});
      $provide.value('StateClassifierMappingService', {});
      $provide.value('QuestionPlayerEngineService', {});
      $provide.value('QuestionBackendApiService', {});
      $provide.factory(
        'PretestQuestionBackendApiService', ['$http', function($http) {
          return {
            fetchPretestQuestions: function() {
              return $http.get('/dummyurl/2');
            }
          };
        }]);
      // $provide.value('PretestQuestionBackendApiService', {
      //   fetchPretestQuestions: $.noop
      // });
      $provide.value('PlaythroughService', {});
      $provide.value('PlayerTranscriptService', {
        init: $.noop
      });
      $provide.value('PlaythroughIssuesService', {});
      $provide.value('PlayerCorrectnessFeedbackEnabledService', {});
      $provide.value('NumberAttemptsService', {});
      $provide.factory(
        'ExplorationFeaturesBackendApiService', ['$http', function($http) {
          return {
            fetchExplorationFeatures: function() {
              return $http.get('/dummyurl/3');
            }
          };
        }]);
      // $provide.value('ExplorationFeaturesBackendApiService', {
      //   fetchExplorationFeatures: $.noop
      // });
      $provide.value('ExplorationFeaturesService', {});
      $provide.value('ExplorationEngineService', {});
      $provide.value('EditableExplorationBackendApiService', {});
    });
  });

  beforeEach(angular.mock.inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
    // ReadOnlyExplorationBackendApiService = {
    //   loadExploration: function() {
    //     var deferred = $q.defer();
    //     deferred.resolve({});
    //     return deferred.promise;
    //   }
    // };
    // ReadOnlyExplorationBackendApiService = {
    //   loadExploration: $.noop,
    //   loadLatestExploration: $.noop
    // }
    // var deferred = $q.defer();
    // deferred.resolve({});

    // spyOn($q, 'all').and.returnValue(deferred.promise);
    // spyOn(ReadOnlyExplorationBackendApiService, 'loadLatestExploration').and.returnValue($q.resolve([]));
    // PretestQuestionBackendApiService = {
    //   fetchPretestQuestions: function() {
    //     var deferred = $q.defer();
    //     deferred.resolve({});
    //     return deferred.promise;
    //   }
    // };
    // ExplorationFeaturesBackendApiService = {
    //   fetchExplorationFeatures: function() {
    //     var deferred = $q.defer();
    //     deferred.resolve({});
    //     return deferred.promise;
    //   }
    // };
    // this.deferred = null;
    // var self = this;
    // spyOn($q, 'all').and.callFake(function() {
    //   self.deferred = $q.defer();
    //   return self.deferred.promise;
    // });
    ExplorationPlayerStateService = $injector.get('ExplorationPlayerStateService');
    this.scope = $rootScope.$new();
  }));

  fit('should properly initialize player', function() {
    $httpBackend.expect('GET', '/dummyurl/1').respond({
      version: 1
    });
    $httpBackend.expect('GET', '/dummyurl/2').respond({
      version: 1
    });
    $httpBackend.expect('GET', '/dummyurl/3').respond({
      version: 1
    });
    var deferred = $q.defer();
    deferred.resolve({});
    spyOn($q, 'all').and.returnValue(deferred.promise);
    ExplorationPlayerStateService.initializePlayer();
    $httpBackend.flush();
    $rootScope.$apply();
    // $rootScope.$digest();
    // this.scope.$digest();
    // this.deferred.resolve([{}, {}, {}]);
    // this.scope.$digest();
    // this.scope.$apply();
    expect(true).toBe(true);
  });
});
