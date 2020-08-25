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
 * @fileoverview Unit tests for the topic selector directive.
 */

import { UpgradedServices } from 'services/UpgradedServices';

describe('Topic selector Directive', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  var $scope = null;
  var ctrl = null;
  var $rootScope = null;
  var directive = null;
  var selectedTopicIds = [];
  var topicSummaries = [{
    additionalStoryCount: 0,
    canEditTopic: true,
    canonicalStoryCount: 0,
    classroom: null,
    description: 'dasd',
    id: 'grVKDzKnenYL',
    isPublished: false,
    languageCode: 'en',
    name: 'asd',
    subtopicCount: 0,
    thumbnailBgColor: '#C6DCDA',
    thumbnailFilename: 'a.svg',
    topicModelCreatedOn: 1598310242241.483,
    topicModelLastUpdated: 1598310242544.855,
    totalSkillCount: 0,
    uncategorizedSkillCount: 0,
    urlFragment: 'd',
    version: 2}, {
    additionalStoryCount: 0,
    canEditTopic: true,
    canonicalStoryCount: 0,
    classroom: null,
    description: 'dasd',
    id: 'topic2',
    isPublished: false,
    languageCode: 'en',
    name: 'asd',
    subtopicCount: 0,
    thumbnailBgColor: '#C6DCDA',
    thumbnailFilename: 'a.svg',
    topicModelCreatedOn: 1598310242241.483,
    topicModelLastUpdated: 1598310242544.855,
    totalSkillCount: 0,
    uncategorizedSkillCount: 0,
    urlFragment: 'd2',
  }];

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');

    $scope = $rootScope.$new();

    directive = $injector.get('selectTopicsDirective')[0];

    $scope.getTopicSummaries = () => {
      return topicSummaries;
    };
    $scope.selectedTopicIds = selectedTopicIds;
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope
    });
  }));

  it('should select and deselect the topics', function() {
    ctrl.$onInit();
    $scope.selectOrDeselectTopic(topicSummaries[0].id, 0);
    expect(selectedTopicIds).toEqual([topicSummaries[0].id]);
    $scope.selectOrDeselectTopic(topicSummaries[1].id, 1);
    expect(selectedTopicIds).toEqual(
      [topicSummaries[0].id, topicSummaries[1].id]);
    $scope.selectOrDeselectTopic(topicSummaries[0].id, 0);
    expect(selectedTopicIds).toEqual([topicSummaries[1].id]);
  });
});
