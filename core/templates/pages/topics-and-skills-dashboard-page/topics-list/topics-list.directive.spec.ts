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

import { UpgradedServices } from 'services/UpgradedServices';

describe('Topics List Directive', function() {
  var $uibModal = null;
  var $scope;
  var ctrl;
  var directive;
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $uibModal = $injector.get('$uibModal');
    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    directive = $injector.get('topicsListDirective')[0];
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

  it('should delete a topic', function() {
    var modalSpy = spyOn($uibModal, 'open').and.callThrough();
    ctrl.deleteTopic('dskfm4');
    expect(modalSpy).toHaveBeenCalled();
  });
});
