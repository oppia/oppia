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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ConceptCard} from 'domain/skill/concept-card.model';
import {
  SkillRights,
  SkillRightsBackendDict,
} from 'domain/skill/skill-rights.model';

import {SkillUpdateService} from 'domain/skill/skill-update.service';
import {Skill, SkillObjectFactory} from 'domain/skill/SkillObjectFactory';
import {SkillEditorStateService} from 'pages/skill-editor-page/services/skill-editor-state.service';
import {SkillDescriptionEditorComponent} from './skill-description-editor.component';

/**
 * @fileoverview Unit tests for SkillDescriptionEditorComponent.
 */

describe('Skill Description Editor Component', () => {
  let component: SkillDescriptionEditorComponent;
  let fixture: ComponentFixture<SkillDescriptionEditorComponent>;

  let skillUpdateService: SkillUpdateService;
  let skillEditorStateService: SkillEditorStateService;
  let skillObjectFactory: SkillObjectFactory;

  let sampleSkillRights: SkillRights;
  let skillRightsDict: SkillRightsBackendDict;
  let sampleSkill: Skill;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SkillDescriptionEditorComponent],
      providers: [SkillUpdateService, SkillEditorStateService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillDescriptionEditorComponent);
    component = fixture.componentInstance;

    skillUpdateService = TestBed.inject(SkillUpdateService);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
  });

  beforeEach(() => {
    skillRightsDict = {
      skill_id: '0',
      can_edit_skill_description: true,
    };

    sampleSkillRights = SkillRights.createFromBackendDict(skillRightsDict);

    sampleSkill = new Skill(
      'id1',
      'Skill description loading',
      [],
      [],
      {} as ConceptCard,
      'en',
      1,
      0,
      'id1',
      false,
      []
    );

    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOn(skillEditorStateService, 'getSkillRights').and.returnValue(
      sampleSkillRights
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should check whether we can edit skill description', () => {
    component.ngOnInit();

    let result = component.canEditSkillDescription();
    expect(result).toBe(true);
  });

  it('should reset error message', () => {
    expect(component.errorMsg).toBe('');

    component.errorMsg = 'errorMessage';
    component.resetErrorMsg();

    expect(component.errorMsg).toBe('');
  });

  it('should set properties when initialized', () => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(skillEditorStateService, 'onSkillChange').and.returnValue(
      mockEventEmitter
    );

    expect(component.errorMsg).toBe('');

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(component.skill).toEqual(sampleSkill);
    expect(component.tmpSkillDescription).toBe('Skill description loading');
    expect(component.skillRights).toEqual(sampleSkillRights);
    expect(component.errorMsg).toBe('');
  });

  it('should save skill description successfully', () => {
    let saveSkillDescriptionSpy = spyOn(
      skillUpdateService,
      'setSkillDescription'
    ).and.callThrough();
    spyOn(component.onSaveDescription, 'emit').and.callThrough();
    spyOn(skillObjectFactory, 'hasValidDescription').and.returnValue(true);
    component.ngOnInit();
    // Old Description.
    expect(component.tmpSkillDescription).toBe('Skill description loading');

    component.saveSkillDescription('newSkillDescription');
    expect(saveSkillDescriptionSpy).toHaveBeenCalled();
    expect(component.onSaveDescription.emit).toHaveBeenCalled();
  });

  it('should not save skill description if it is old description', () => {
    let saveSkillDescriptionSpy = spyOn(
      skillUpdateService,
      'setSkillDescription'
    ).and.callThrough();
    component.ngOnInit();
    // Old Description.
    expect(component.tmpSkillDescription).toBe('Skill description loading');
    // Setting new description as old description.
    component.saveSkillDescription('Skill description loading');
    expect(saveSkillDescriptionSpy).not.toHaveBeenCalled();
  });

  it('should not save skill description if it has invalid character', () => {
    let saveSkillDescriptionSpy = spyOn(
      skillUpdateService,
      'setSkillDescription'
    ).and.callThrough();
    spyOn(skillObjectFactory, 'hasValidDescription').and.returnValue(false);
    component.ngOnInit();
    // Old Description.
    expect(component.tmpSkillDescription).toBe('Skill description loading');
    // Setting new description with invalid characters.
    component.saveSkillDescription('-invalid-description-');
    expect(saveSkillDescriptionSpy).not.toHaveBeenCalled();
  });
});
