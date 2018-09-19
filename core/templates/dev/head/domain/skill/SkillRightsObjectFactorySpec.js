// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for SkillRightsObjectFactory.
 */

describe('Skill rights object factory', function() {
  var SkillRightsObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    SkillRightsObjectFactory = $injector.get('SkillRightsObjectFactory');
  }));

  it('should be able to set public', function() {
    var initialSkillRightsBackendObject = {
      skill_id: 0,
      can_edit_skill_description: true,
      creator_id: 0,
      skill_is_private: true
    };

    var skillRights = SkillRightsObjectFactory.createFromBackendDict(
      initialSkillRightsBackendObject);

    expect(skillRights.isPublic()).toBe(false);
    expect(skillRights.isPrivate()).toBe(true);

    skillRights.setPublic();

    expect(skillRights.isPublic()).toBe(true);
    expect(skillRights.isPrivate()).toBe(false);
  });

  it('should create an interstitial skill rights object', function() {
    var interstitialSkillRights =
      SkillRightsObjectFactory.createInterstitialSkillRights();

    expect(interstitialSkillRights.getSkillId()).toEqual(null);
    expect(interstitialSkillRights.getCreatorId()).toEqual(null);
    expect(interstitialSkillRights.isPrivate()).toBe(true);
    expect(interstitialSkillRights.canEditSkillDescription()).toBe(false);
  });

  it('should make a copy from another skill rights object', function() {
    var sampleSkillRightsObject = {
      skill_id: '1',
      can_edit_skill_description: true,
      creator_id: '2',
      skill_is_private: false
    };

    var sampleSkillRights = SkillRightsObjectFactory.createFromBackendDict(
      sampleSkillRightsObject);

    var interstitialSkillRights =
      SkillRightsObjectFactory.createInterstitialSkillRights();

    interstitialSkillRights.copyFromSkillRights(sampleSkillRights);
    expect(interstitialSkillRights.getSkillId()).toEqual('1');
    expect(interstitialSkillRights.getCreatorId()).toEqual('2');
    expect(interstitialSkillRights.canEditSkillDescription()).toBe(true);
    expect(interstitialSkillRights.isPrivate()).toBe(false);
  });
});
