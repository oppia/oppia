// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the exploration history tab.
 */

import { EventEmitter } from '@angular/core';

import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { EditabilityService } from 'services/editability.service';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { VersionTreeService } from
  'pages/exploration-editor-page/history-tab/services/version-tree.service';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { TestBed } from '@angular/core/testing';
import { ExplorationDiffService } from '../services/exploration-diff.service';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { CsrfTokenService } from 'services/csrf-token.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('History tab component', function() {
  var ctrl = null;
  var $httpBackend = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var compareVersionsService = null;
  var editabilityService = null;
  var csrfTokenService = null;
  var dateTimeFormatService = null;
  var windowRef = null;

  var mockRefreshVersionHistoryEmitter = new EventEmitter();

  var explorationId = 'exp1';
  var snapshots = [{
    commit_message: 'This is the commit message',
    committer_id: 'committer_3',
    commit_type: '',
    version_number: 1,
    created_on_ms: 1416563100000,
    commit_cmds: []
  }, {
    commit_message: 'This is the commit message 2',
    committer_id: 'committer_3',
    commit_type: '',
    version_number: 2,
    created_on_ms: 1416563100000,
    commit_cmds: []
  }];

  beforeEach(function() {
    dateTimeFormatService = TestBed.get(DateTimeFormatService);
    editabilityService = TestBed.get(EditabilityService);
    windowRef = TestBed.get(WindowRef);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'AnswerGroupObjectFactory', TestBed.get(AnswerGroupObjectFactory));
    $provide.value('CsrfTokenService', TestBed.get(CsrfTokenService));
    $provide.value('EditabilityService', TestBed.get(EditabilityService));
    $provide.value(
      'ExplorationDiffService', TestBed.get(ExplorationDiffService));
    $provide.value(
      'FractionObjectFactory', TestBed.get(FractionObjectFactory));
    $provide.value('StatesObjectFactory', TestBed.get(StatesObjectFactory));
    $provide.value(
      'HintObjectFactory', TestBed.get(HintObjectFactory));
    $provide.value(
      'OutcomeObjectFactory', TestBed.get(OutcomeObjectFactory));
    $provide.value(
      'ParamChangeObjectFactory', TestBed.get(ParamChangeObjectFactory));
    $provide.value(
      'ParamChangesObjectFactory', TestBed.get(ParamChangesObjectFactory));
    $provide.value(
      'RecordedVoiceoversObjectFactory',
      TestBed.get(RecordedVoiceoversObjectFactory));
    $provide.value('RuleObjectFactory', TestBed.get(RuleObjectFactory));
    $provide.value(
      'SubtitledHtmlObjectFactory', TestBed.get(SubtitledHtmlObjectFactory));
    $provide.value('UnitsObjectFactory', TestBed.get(UnitsObjectFactory));
    $provide.value('VersionTreeService', TestBed.get(VersionTreeService));
    $provide.value(
      'VoiceoverObjectFactory', TestBed.get(VoiceoverObjectFactory));
    $provide.value(
      'WrittenTranslationObjectFactory',
      TestBed.get(WrittenTranslationObjectFactory));
    $provide.value(
      'WrittenTranslationsObjectFactory',
      TestBed.get(WrittenTranslationsObjectFactory));
    $provide.value('ExplorationDataService', {
      explorationId: explorationId,
      data: {
        version: 2
      },
      getData: () => $q.resolve({
        version: 2,
      })
    });
    $provide.value('RouterService', {
      onRefreshVersionHistory: mockRefreshVersionHistoryEmitter
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    compareVersionsService = $injector.get('CompareVersionsService');
    csrfTokenService = $injector.get('CsrfTokenService');

    spyOn(csrfTokenService, 'getTokenAsync')
      .and.returnValue($q.resolve('sample-csrf-token'));
    spyOn(dateTimeFormatService, 'getLocaleDateTimeHourString')
      .and.returnValue('11/21/2014');

    $scope = $rootScope.$new();
    ctrl = $componentController('historyTab', {
      $scope: $scope,
      DateTimeFormatService: dateTimeFormatService,
      EditabilityService: editabilityService,
      WindowRef: windowRef
    });
    ctrl.$onInit();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should initialize controller properties after its initialization',
    function() {
      expect(ctrl.explorationId).toBe(explorationId);
      expect(ctrl.explorationAllSnapshotsUrl).toBe(
        '/createhandler/snapshots/exp1');
      expect(ctrl.revertExplorationUrl).toBe('/createhandler/revert/exp1');
      expect(ctrl.explorationDownloadUrl).toBe('/createhandler/download/exp1');

      expect(ctrl.explorationVersionMetadata).toBe(null);
      expect(ctrl.versionCheckboxArray).toEqual([]);
      expect(ctrl.displayedCurrentPageNumber).toBe(1);
      expect(ctrl.versionNumbersToDisplay).toEqual([]);
    });

  it('should refresh version history when refreshVersionHistory flag is' +
    ' broadcasted and force refresh is true', function() {
    $httpBackend.expect('GET', '/createhandler/snapshots/exp1').respond({
      snapshots: snapshots
    });
    ctrl.refreshVersionHistory();
    $scope.$apply();
    $httpBackend.flush();

    var data = {
      forceRefresh: true
    };

    $httpBackend.expect('GET', '/createhandler/snapshots/exp1').respond({
      snapshots: snapshots
    });
    mockRefreshVersionHistoryEmitter.emit(data);
    $scope.$apply();

    expect(ctrl.currentVersion).toBe(2);
    expect(ctrl.hideHistoryGraph).toBe(true);
    expect(ctrl.comparisonsAreDisabled).toBe(false);
  });

  it('should compare selected versions successfully', function() {
    $httpBackend.expect('GET', '/createhandler/snapshots/exp1').respond({
      snapshots: snapshots
    });
    ctrl.refreshVersionHistory();
    $scope.$apply();
    $httpBackend.flush();

    ctrl.changeSelectedVersions({
      committerId: 'committer_3',
      createdOnMsecsStr: '11/21/2014',
      commitMessage: 'This is the commit message',
      versionNumber: 1
    }, 1);

    ctrl.changeSelectedVersions({
      committerId: 'committer_3',
      createdOnMsecsStr: '11/21/2014',
      commitMessage: 'This is the commit message',
      versionNumber: 2
    }, 2);

    spyOn(compareVersionsService, 'getDiffGraphData').and.returnValue(
      $q.resolve({}));
    ctrl.compareSelectedVersions();
    ctrl.changeCompareVersion();
    $scope.$apply();

    expect(ctrl.hideHistoryGraph).toBe(false);
    expect(ctrl.diffData).toEqual({});

    expect(ctrl.earlierVersionHeader).toBe(
      'Revision #1 by committer_3 (11/21/2014):' +
        ' This is the commit message');
    expect(ctrl.laterVersionHeader).toBe(
      'Revision #2 by committer_3 (11/21/2014):' +
        ' This is the commit message 2');
  });

  it('should open a new tab for download exploration with version', function() {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      open: jasmine.createSpy('open', () => {})
    });
    ctrl.downloadExplorationWithVersion(1);

    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/createhandler/download/exp1?v=1', '&output_format=zip');
  });

  it('should open revert exploration modal', function() {
    spyOn($uibModal, 'open').and.callThrough();

    ctrl.showRevertExplorationModal();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should reload page when closing revert exploration modal', function() {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        reload: jasmine.createSpy('reload', () => {})
      }
    });
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve(1)
    });

    $httpBackend.expectPOST('/createhandler/revert/exp1').respond(200);
    ctrl.showRevertExplorationModal(1);
    $scope.$apply();
    $httpBackend.flush();

    expect(windowRef.nativeWindow.location.reload).toHaveBeenCalled();
  });

  it('should not reload page when dismissing revert exploration modal',
    function() {
      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: {
          reload: jasmine.createSpy('reload', () => {})
        }
      });
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });

      ctrl.showRevertExplorationModal(1);
      $scope.$apply();

      expect(windowRef.nativeWindow.location.reload).not.toHaveBeenCalled();
    });

  it('should return if the content is editable', function() {
    spyOn(editabilityService, 'isEditable').and.returnValue(false);
    expect(ctrl.isEditable()).toEqual(false);
  });

  it('should filter the history by username', function() {
    var snapshots = [{
      commit_message: 'This is the commit message',
      committerId: 'committer_3',
      commit_type: '',
      version_number: 1,
      created_on_ms: 1416563100000,
      commit_cmds: []
    }, {
      commit_message: 'This is the commit message 2',
      committerId: 'committer_3',
      commit_type: '',
      version_number: 2,
      created_on_ms: 1416563100000,
      commit_cmds: []
    }, {
      commit_message: 'This is the commit message 2',
      committerId: 'committer_1',
      commit_type: '',
      version_number: 2,
      created_on_ms: 1416563100000,
      commit_cmds: []
    }];
    ctrl.totalExplorationVersionMetadata = snapshots;
    ctrl.username = '';
    ctrl.filterByUsername();
    expect(ctrl.explorationVersionMetadata).toEqual(snapshots);

    ctrl.username = 'committer_3';
    ctrl.filterByUsername();
    expect(ctrl.explorationVersionMetadata).toEqual(
      [snapshots[0], snapshots[1]]);

    ctrl.username = 'committer_1';
    ctrl.filterByUsername();
    expect(ctrl.explorationVersionMetadata).toEqual([snapshots[2]]);
  });

  it('should reset the graph', function() {
    ctrl.hideHistoryGraph = false;
    ctrl.resetGraph();
    expect(ctrl.hideHistoryGraph).toBe(true);
  });

  it('should toggle history options', function() {
    ctrl.toggleHistoryOptions(10);
    expect(ctrl.highlightedIndex).toBe(10);
    ctrl.toggleHistoryOptions(10);
    expect(ctrl.highlightedIndex).toBe(null);
    ctrl.toggleHistoryOptions(5);
    expect(ctrl.highlightedIndex).toBe(5);
  });

  it('should reverse the array when the date filter is applied', function() {
    var snapshots = [{
      commit_message: 'This is the commit message',
      committerId: 'committer_3',
      commit_type: '',
      version_number: 1,
      created_on_ms: 1416563100000,
      commit_cmds: []
    }, {
      commit_message: 'This is the commit message 2',
      committerId: 'committer_3',
      commit_type: '',
      version_number: 2,
      created_on_ms: 1416563100000,
      commit_cmds: []
    }, {
      commit_message: 'This is the commit message 2',
      committerId: 'committer_1',
      commit_type: '',
      version_number: 3,
      created_on_ms: 1416563100000,
      commit_cmds: []
    }];
    ctrl.explorationVersionMetadata = snapshots;
    ctrl.reverseDateOrder();
    expect(ctrl.explorationVersionMetadata[0].version_number).toEqual(3);
    expect(ctrl.explorationVersionMetadata[2].version_number).toEqual(1);

    ctrl.reverseDateOrder();
    expect(ctrl.explorationVersionMetadata[0].version_number).toEqual(1);
    expect(ctrl.explorationVersionMetadata[2].version_number).toEqual(3);
  });

  it('should find the versions to compare', function() {
    ctrl.selectedVersionsArray = [1, 4];
    ctrl.compareVersionMetadata = {};
    ctrl.totalExplorationVersionMetadata = [
      {
        committerId: '1',
        createdOnMsecsStr: 10,
        commitMessage: 'commit message 1',
        versionNumber: 1
      }, {
        committerId: '2',
        createdOnMsecsStr: 10,
        commitMessage: 'commit message 2',
        versionNumber: 2
      }, {
        committerId: '3',
        createdOnMsecsStr: 10,
        commitMessage: 'commit message 3',
        versionNumber: 3
      }, {
        committerId: '4',
        createdOnMsecsStr: 10,
        commitMessage: 'commit message 4',
        versionNumber: 4
      }];
    ctrl.changeCompareVersion();
    expect(ctrl.compareVersionMetadata.earlierVersion).toEqual(
      ctrl.totalExplorationVersionMetadata[0]);
    expect(ctrl.compareVersionMetadata.laterVersion).toEqual(
      ctrl.totalExplorationVersionMetadata[3]);

    ctrl.selectedVersionsArray = [2, 4];

    ctrl.changeCompareVersion();
    expect(ctrl.compareVersionMetadata.earlierVersion).toEqual(
      ctrl.totalExplorationVersionMetadata[1]);
    expect(ctrl.compareVersionMetadata.laterVersion).toEqual(
      ctrl.totalExplorationVersionMetadata[3]);

    ctrl.selectedVersionsArray = [2, 3];

    ctrl.changeCompareVersion();
    expect(ctrl.compareVersionMetadata.earlierVersion).toEqual(
      ctrl.totalExplorationVersionMetadata[1]);
    expect(ctrl.compareVersionMetadata.laterVersion).toEqual(
      ctrl.totalExplorationVersionMetadata[2]);
  });
});
