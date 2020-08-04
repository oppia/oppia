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
 * @fileoverview Unit tests for practiceTab.
 */

import { TestBed } from '@angular/core/testing';
import { SubtopicObjectFactory } from 'domain/topic/SubtopicObjectFactory';

describe('Practice tab component', function() {
  var ctrl = null;
  var $scope = null;
  var subtopicObjectFactory = null;

  var mockWindow = {
    location: {
      href: '',
      reload: () => {}
    }
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
  }));

  beforeEach(function() {
    subtopicObjectFactory = TestBed.get(SubtopicObjectFactory);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');

    $scope = $rootScope.$new();
    ctrl = $componentController('practiceTab', {
      $scope: $scope
    }, {
      getTopicName: () => 'Topic Name',
      getSubtopicsList: () => ([
        subtopicObjectFactory.create({
          id: 1,
          title: 'Subtopic 1',
          skill_ids: ['1', '2'],
          thumbnail_filename: '',
          thumbnail_bg_color: ''
        }, {
          1: 'First skill',
          2: 'Second skill'
        }),
        subtopicObjectFactory.create({
          id: 2,
          title: 'Subtopic 2',
          skill_ids: [],
          thumbnail_filename: '',
          thumbnail_bg_color: ''
        })
      ])
    });
    ctrl.$onInit();
  }));

  it('should initialize correctly controller properties after its' +
    ' initialization', function() {
    expect(ctrl.selectedSubtopics).toEqual([]);
    expect(ctrl.availableSubtopics.length).toBe(1);
    expect(ctrl.selectedSubtopicIndices).toEqual([false]);
  });

  it('should have start button enabled when a subtopic is selected',
    function() {
      ctrl.selectedSubtopicIndices[0] = true;
      expect(ctrl.isStartButtonDisabled()).toBe(false);
    });

  it('should have start button disabled when there is no subtopic selected',
    function() {
      ctrl.selectedSubtopicIndices[0] = false;
      expect(ctrl.isStartButtonDisabled()).toBe(true);
    });

  it('should open a new practice session containing the selected subtopic' +
    ' when starting to practice', function() {
    ctrl.selectedSubtopicIndices[0] = true;
    ctrl.openNewPracticeSession();

    expect(mockWindow.location.href).toBe(
      '/practice_session/Topic%20Name?selected_subtopic_ids=1');
  });
});
