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
 * @fileoverview Unit tests for topic preview tab.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { StorySummary} from 'domain/story/story-summary.model';
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Topic preview tab', function() {
  var ctrl = null;
  var $rootScope = null;
  var $scope = null;
  var TopicEditorStateService = null;

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableStoryBackendApiService]
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'EditableStoryBackendApiService',
      TestBed.get(EditableStoryBackendApiService));
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    $scope = $rootScope.$new();
    ctrl = $componentController('topicPreviewTab', {
      $scope: $scope,
    });
    const sampleStorySummaryBackendDict = {
      id: 'sample_story_id',
      title: 'Story title',
      node_titles: ['Chapter 1', 'Chapter 2'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      description: 'Description',
      story_is_published: true,
      completed_node_titles: ['Chapter 1'],
      url_fragment: 'story-url-fragment',
      all_node_dicts: []
    };
    var story = StorySummary.createFromBackendDict(
      sampleStorySummaryBackendDict);
    spyOn(
      TopicEditorStateService,
      'getCanonicalStorySummaries').and.returnValue([story]);
    ctrl.$onInit();
  }));

  it('should initialize the variables', function() {
    expect(ctrl.activeTab).toEqual('story');
  });

  it('should return the static image url', function() {
    var imagePath = '/path/to/image.png';
    expect(ctrl.getStaticImageUrl(imagePath)).toBe(
      '/assets/images/path/to/image.png');
  });

  it('should change the preview tab', function() {
    ctrl.changePreviewTab('story');
    expect(ctrl.activeTab).toEqual('story');
    ctrl.changePreviewTab('subtopic');
    expect(ctrl.activeTab).toEqual('subtopic');
    ctrl.changePreviewTab('practice');
    expect(ctrl.activeTab).toEqual('practice');
  });
});
