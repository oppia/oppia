// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit test for SkillCreationService.
 */

import {TestBed} from '@angular/core/testing';
import {TopicsAndSkillsDashboardPageConstants} from 'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants';
import {SkillCreationService} from './skill-creation.service';

describe('SkillCreationService', () => {
  let skillCreationService: SkillCreationService;

  beforeEach(() => {
    skillCreationService = TestBed.inject(SkillCreationService);
  });

  it('should get skill description status', () => {
    expect(skillCreationService.getSkillDescriptionStatus()).toBe(
      TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES
        .STATUS_UNCHANGED
    );
  });

  it('should mark change in skill description status', () => {
    expect(skillCreationService.skillDescriptionStatusMarker).toBe(
      TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES
        .STATUS_UNCHANGED
    );

    skillCreationService.markChangeInSkillDescription();

    expect(skillCreationService.skillDescriptionStatusMarker).toBe(
      TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES
        .STATUS_CHANGED
    );
  });

  it('should disable skill description status marker', () => {
    expect(skillCreationService.skillDescriptionStatusMarker).toBe(
      TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES
        .STATUS_UNCHANGED
    );

    skillCreationService.disableSkillDescriptionStatusMarker();

    expect(skillCreationService.skillDescriptionStatusMarker).toBe(
      TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES
        .STATUS_DISABLED
    );
  });

  it('should reset skill description status marker', () => {
    expect(skillCreationService.skillDescriptionStatusMarker).toBe(
      TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES
        .STATUS_UNCHANGED
    );

    skillCreationService.disableSkillDescriptionStatusMarker();

    expect(skillCreationService.skillDescriptionStatusMarker).toBe(
      TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES
        .STATUS_DISABLED
    );

    skillCreationService.resetSkillDescriptionStatusMarker();

    expect(skillCreationService.skillDescriptionStatusMarker).toBe(
      TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES
        .STATUS_UNCHANGED
    );
  });
});
