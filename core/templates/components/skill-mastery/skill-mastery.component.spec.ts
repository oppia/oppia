// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SkillMasteryViewerComponent.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {SkillMasteryViewerComponent} from './skill-mastery.component';
import {SkillMasteryListConstants} from 'components/skills-mastery-list/skills-mastery-list.constants';
import {SkillMasteryBackendApiService} from 'domain/skill/skill-mastery-backend-api.service';
import {SkillMastery} from 'domain/skill/skill-mastery.model';

let component: SkillMasteryViewerComponent;
let fixture: ComponentFixture<SkillMasteryViewerComponent>;

describe('SkillMasteryViewerComponent', () => {
  let skillMasteryBackendApiService: SkillMasteryBackendApiService;
  const mockSkillMastery = SkillMastery.createFromBackendDict({
    skillId1: 1.0,
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SkillMasteryViewerComponent],
      providers: [SkillMasteryBackendApiService],
      imports: [HttpClientTestingModule],
    }).compileComponents();
    skillMasteryBackendApiService = TestBed.get(SkillMasteryBackendApiService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillMasteryViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize skillMasteryDegree on ngOnInit', () => {
    component.skillId = 'skillId1';
    spyOn(
      skillMasteryBackendApiService,
      'fetchSkillMasteryDegreesAsync'
    ).and.returnValue(Promise.resolve(mockSkillMastery));
    component.ngOnInit();
    expect(
      skillMasteryBackendApiService.fetchSkillMasteryDegreesAsync
    ).toHaveBeenCalledWith(['skillId1']);
  });

  it('should get skill mastery percentage', () => {
    component.ngOnInit();
    expect(component.getSkillMasteryPercentage()).toBe(0);
    component.skillMasteryDegree = 21.21;
    expect(component.getSkillMasteryPercentage()).toBe(2121);
  });

  it('should get skill mastery change percentage', () => {
    component.masteryChange = 0;
    expect(component.getMasteryChangePercentage()).toBe('+0');
    component.masteryChange = 1.112;
    expect(component.getMasteryChangePercentage()).toBe('+111');
    component.masteryChange = -1.112;
    expect(component.getMasteryChangePercentage()).toBe(-111);
  });

  it('should get learning tips', () => {
    component.masteryChange = 0;
    expect(component.getLearningTips()).toBe(
      'Looks like your mastery of this skill has dropped. ' +
        'To improve it, try reviewing the concept card below and ' +
        'then practicing more questions for the skill.'
    );
    component.masteryChange = -1;
    expect(component.getLearningTips()).toBe(
      'Looks like your mastery of this skill has dropped. ' +
        'To improve it, try reviewing the concept card below and ' +
        'then practicing more questions for the skill.'
    );
    component.masteryChange = 1;
    component.skillMasteryDegree =
      SkillMasteryListConstants.MASTERY_CUTOFF.GOOD_CUTOFF;
    expect(component.getLearningTips()).toBe(
      'You have mastered this skill very well! ' +
        'You can work on other skills or learn new skills.'
    );
    component.skillMasteryDegree =
      SkillMasteryListConstants.MASTERY_CUTOFF.MEDIUM_CUTOFF;
    expect(component.getLearningTips()).toBe(
      'You have made progress! You can increase your ' +
        'mastery level by doing more practice sessions.'
    );
  });
});
