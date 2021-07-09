// Copyright 202 The Oppia Authors. All Rights Reserved.
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
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { ExplorationPlayerStateService } from '../services/exploration-player-state.service';
import { PlayerPositionService } from '../services/player-position.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { EventEmitter } from '@angular/core';

fdescribe('Progress nav directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let $timeout = null;
  let directive = null;
  let explorationEngineService: ExplorationEngineService = null;
  let explorationPlayerStateService: ExplorationPlayerStateService = null;
  let playerPositionService: PlayerPositionService = null;
  let playerTranscriptService: PlayerTranscriptService = null;
  let focusManagerService: FocusManagerService = null;
  let urlService: UrlService = null;
  let windowDimensionsService: WindowDimensionsService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    focusManagerService = TestBed.get(FocusManagerService);
  });

  afterEach(function() {
    ctrl.$onDestroy();
  });

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();
    focusManagerService = $injector.get('FocusManagerService');
    explorationEngineService = $injector.get('ExplorationEngineService');
    explorationPlayerStateService = $injector.get(
        'ExplorationPlayerStateService');
    playerPositionService = TestBed.inject(PlayerPositionService);
    playerTranscriptService = $injector.get('PlayerTranscriptService');
    urlService = $injector.get('UrlService');
    windowDimensionsService = $injector.get('WindowDimensionsService');

    directive = $injector.get('progressNavDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });

  }));

  it('should set properties when initialized', function() {
    let mockEventEmitter = new EventEmitter()
    spyOn(playerPositionService, 'onHelpCardAvailable')
      .and.returnValue(mockEventEmitter);
    let helpCard = {
      hasContinueButton: true
    };
    ctrl.$onInit();
    $scope.$digest();
    mockEventEmitter.emit(helpCard);
  });
});