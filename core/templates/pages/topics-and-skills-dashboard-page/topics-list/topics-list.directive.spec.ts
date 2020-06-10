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
 * @fileoverview Unit tests for the topics and skills dashboard directive.
 */

import { AlertsService } from 'services/alerts.service';

describe('Topics List Directive', function() {
  var $uibModal = null;
  var $scope = null;
  var ctrl = null;
  var $q = null;
  var $httpBackend = null;
  var $rootScope = null;
  var directive = null;
  var AlertsService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    $uibModal = $injector.get('$uibModal');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    directive = $injector.get('topicsListDirective')[0];
    $q = $injector.get('$q');
    AlertsService = $injector.get('AlertsService');
    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope,
      $uibModal,
    });
  }));

  it('should init the controller', function() {
    ctrl.$onInit();
    const topicHeadings = [
      'index', 'name', 'canonical_story_count', 'subtopic_count',
      'skill_count', 'topic_status'
    ];
    expect(ctrl.selectedIndex).toEqual(null);
    expect(ctrl.TOPIC_HEADINGS).toEqual(topicHeadings);
  });

  it('should return topic editor url', function() {
    const topicId1 = 'uXcdsad3f42';
    const topicId2 = 'aEdf44DGfre';
    expect(ctrl.getTopicEditorUrl(topicId1)).toEqual(
      '/topic_editor/uXcdsad3f42');
    expect(ctrl.getTopicEditorUrl(topicId2)).toEqual(
      '/topic_editor/aEdf44DGfre');
  });

  it('should select and show edit options for a topic', function() {
    const topicId1 = 'uXcdsad3f42';
    const topicId2 = 'aEdf44DGfre';
    expect(ctrl.showEditOptions(topicId1)).toEqual(false);
    expect(ctrl.showEditOptions(topicId2)).toEqual(false);

    ctrl.enableEditOptions(topicId1);
    expect(ctrl.showEditOptions(topicId1)).toEqual(true);
    expect(ctrl.showEditOptions(topicId2)).toEqual(false);

    ctrl.enableEditOptions(topicId2);
    expect(ctrl.showEditOptions(topicId1)).toEqual(false);
    expect(ctrl.showEditOptions(topicId2)).toEqual(true);

    ctrl.enableEditOptions(null);
    expect(ctrl.showEditOptions(topicId1)).toEqual(false);
    expect(ctrl.showEditOptions(topicId2)).toEqual(false);
  });

  it('should open the delete topic modal', function() {
    var modalSpy = spyOn($uibModal, 'open').and.callThrough();
    ctrl.deleteTopic('dskfm4');
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should return serial number for topic', function() {
    ctrl.getPageNumber = function() {
      return 0;
    };
    ctrl.getItemsPerPage = function() {
      return 10;
    };
    expect(ctrl.getSerialNumberForTopic(2)).toEqual(3);
    ctrl.getPageNumber = function() {
      return 3;
    };
    ctrl.getItemsPerPage = function() {
      return 15;
    };
    expect(ctrl.getSerialNumberForTopic(2)).toEqual(48);
  });

  it('should reinitialize the page after successfully deleting the topic',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });
      spyOn($rootScope, '$broadcast');

      var topicId = 'CdjnJUE332dd';
      var url = `/topic_editor_handler/data/${topicId}`;
      $httpBackend.expectDELETE(url).respond(200);
      ctrl.deleteTopic(topicId);

      $httpBackend.flush();
      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'topicsAndSkillsDashboardReinitialized');
    });

  it('should show the warning if deleting a topic failed', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    var alertSpy = spyOn(AlertsService, 'addWarning').and.callThrough();

    var topicId = 'CdjnJUE332dd';
    var url = '/topic_editor_handler/data/CdjnJUE332dd';
    $httpBackend.expectDELETE(url).respond(400);
    ctrl.deleteTopic(topicId);
    $httpBackend.flush();

    expect(alertSpy).toHaveBeenCalledWith(
      'There was an error when deleting the topic.');
  });
});
