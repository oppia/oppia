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
 * @fileoverview Tests for SkillRightsModel.
 */

import { SkillRights } from
  'domain/skill/skill-rights.model';

describe('Skill rights model', () => {
  it('should create an interstitial skill rights object', () => {
    var interstitialSkillRights =
      SkillRights.createInterstitialSkillRights();

    expect(interstitialSkillRights.getSkillId()).toEqual(null);
    expect(interstitialSkillRights.canEditSkillDescription()).toBe(false);
  });

  it('should make a copy from another skill rights object', () => {
    var sampleSkillRightsObject = {
      skill_id: '1',
      can_edit_skill_description: true
    };

    var sampleSkillRights = SkillRights.createFromBackendDict(
      sampleSkillRightsObject);

    var interstitialSkillRights =
      SkillRights.createInterstitialSkillRights();

    interstitialSkillRights.copyFromSkillRights(sampleSkillRights);
    expect(interstitialSkillRights.getSkillId()).toEqual('1');
    expect(interstitialSkillRights.canEditSkillDescription()).toBe(true);
  });
});
