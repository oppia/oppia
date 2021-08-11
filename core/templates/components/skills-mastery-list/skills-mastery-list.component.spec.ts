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

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

/**
 * @fileoverview Unit tests for Skills Mastery List Component.
 */

describe('Skills Mastery List Component', () => {
  let ctrl = null;
  let $scope = null;
  let $rootScope = null;
  let $q = null;
  let $uibModal = null;
  let MASTERY_COLORS = null;

  let UserService = null;

  let userInfo = {
    _roles: ['USER_ROLE'],
    _isModerator: true,
    _isCurriculumAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isCurriculumAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    isTranslationAdmin: () => false,
    isQuestionAdmin: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
    $uibModal = $injector.get('$uibModal');
    $scope = $rootScope.$new();

    MASTERY_COLORS = $injector.get('MASTERY_COLORS');
    UserService = $injector.get('UserService');

    ctrl = $componentController('skillsMasteryList', {
      $scope: $scope
    }, {
      getDegreesOfMastery: () => {
        return {
          skill1: 0.50,
          skill2: 0.29
        };
      },
      getSkillDescriptions: () => {
        return {
          skill1: 'Skill 1 description'
        };
      }
    });
  }));

  it('should set component properties on initialization', () => {
    spyOn(UserService, 'getUserInfoAsync').and.returnValue($q.resolve(
      userInfo));

    ctrl.$onInit();
    $scope.$apply();

    expect(ctrl.userIsLoggedIn).toBe(true);
    expect(ctrl.sortedSkillIds).toEqual([]);
    expect(ctrl.skillIdsAndMastery).toEqual([
      {
        skillId: 'skill1',
        mastery: 0.50
      },
      {
        skillId: 'skill2',
        mastery: 0.29
      }
    ]);
  });

  it('should get mastery percentage from degree of mastery', () => {
    expect(ctrl.getMasteryPercentage(0.33)).toBe(33);
    expect(ctrl.getMasteryPercentage(0.354)).toBe(35);
  });

  it('should get color for mastery according to degree of mastery', () => {
    expect(ctrl.getColorForMastery(0.91)).toBe(
      MASTERY_COLORS.GOOD_MASTERY_COLOR);
    expect(ctrl.getColorForMastery(0.44)).toBe(
      MASTERY_COLORS.MEDIUM_MASTERY_COLOR);
    expect(ctrl.getColorForMastery(0.10)).toBe(
      MASTERY_COLORS.BAD_MASTERY_COLOR);
  });

  it('should get mastery bar style for a skill', () => {
    console.error(ctrl.getMasteryBarStyle('skill1'));
  });

  it('should open concept card modal when user clicks on concept card', () => {
    let skillDescription, skillId;

    spyOn($uibModal, 'open').and.callFake((options) => {
      skillDescription = options.resolve.skillDescription();
      skillId = options.resolve.skillId();
      return {
        result: $q.resolve()
      };
    });
    ctrl.openConceptCardModal('skill1');
    $scope.$apply();

    expect(skillId).toBe('skill1');
    expect(skillDescription).toBe('Skill 1 description');
  });
});
