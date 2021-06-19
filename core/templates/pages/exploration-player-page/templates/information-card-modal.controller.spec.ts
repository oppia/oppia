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
 * @fileoverview Unit tests for InformationCardModalController.
 */

import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Information Card Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var DateTimeFormatService = null;

  var expInfo = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    DateTimeFormatService = $injector.get('DateTimeFormatService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    expInfo = {
      id: '0',
      num_views: 2,
      human_readable_contributors_summary: {
        contributor_1: {
          num_commits: 12
        },
        contributor_2: {
          num_commits: 3
        }
      },
      created_on_msec: 1581965806278.269,
      ratings: {
        5: 0,
        4: 3,
        1: 0,
        3: 2,
        2: 1
      },
      last_updated_msec: 1581965806278.183,
      language_code: 'en',
      category: 'Test',
      objective: 'Dummy exploration for testing all interactions',
      activity_type: 'exploration',
      status: 'public',
      thumbnail_bg_color: '#a33f40',
      tags: [
        'h1', 'h2', 'p', 'attrs', 'quote', 'body', 'select', 'option',
        'form', 'section', 'input', 'img', 'div'],
      thumbnail_icon_url: '/subjects/Lightbulb.svg',
      community_owned: true,
      title: 'Test of all interactions'
    };

    // This method is being mocked because the return value can be tricky
    // depending on timezone.
    spyOn(DateTimeFormatService, 'getLocaleAbbreviatedDatetimeString').and
      .returnValue('Feb 17');

    $scope = $rootScope.$new();
    $controller('InformationCardModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      expInfo: expInfo
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.averageRating).toBe(3.3333333333333335);
      expect($scope.contributorNames).toEqual(
        ['contributor_1', 'contributor_2']);
      expect($scope.explorationId).toBe('0');
      expect($scope.explorationTags).toEqual({
        tagsToShow: [
          'h1',
          'h2',
          'p',
          'attrs',
          'quote',
          'body',
          'select',
          'option',
          'form'],
        tagsInTooltip: ['section', 'input', 'img', 'div']
      });
      expect($scope.explorationTitle).toBe('Test of all interactions');
      expect($scope.infoCardBackgroundCss).toEqual({
        'background-color': '#a33f40'
      });
      expect($scope.infoCardBackgroundImageUrl).toBe('/subjects/Lightbulb.svg');
      expect($scope.lastUpdatedString).toBe('Feb 17');
      expect($scope.numViews).toBe(2);
      expect($scope.objective).toBe(
        'Dummy exploration for testing all interactions');
      expect($scope.explorationIsPrivate).toBe(false);
    });

  it('should wrapper text of given html element when getting css properties',
    function() {
      spyOn(document, 'querySelectorAll')
        // This throws "Type '{ clientWidth: number; }' is missing the following
        // properties from type 'Element': assignedSlot, attributes, classList,
        // className, and 122 more.". We need to suppress this error because
        // typescript expects around 120 more properties than just one
        // (clientWidth). We need only one 'clientWidth' for
        // testing purposes.
        // @ts-expect-error
        .withArgs('.oppia-info-card-logo-thumbnail').and.returnValue([{
          clientWidth: 200
        }]);
      expect($scope.titleWrapper()).toEqual({
        'word-wrap': 'break-word',
        width: '180'
      });
    });

  it('should get complete image path corresponding to a given' +
    ' relative path', function() {
    expect($scope.getStaticImageUrl('/path/to/image.png')).toBe(
      '/assets/images/path/to/image.png');
  });
});
