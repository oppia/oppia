// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit Test for create new skill modal.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ChangeDetectorRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {SkillCreationService} from 'components/entity-creation-services/skill-creation.service';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {SkillEditorStateService} from 'pages/skill-editor-page/services/skill-editor-state.service';
import {PageContextService} from 'services/page-context.service';
import {CreateNewSkillModalComponent} from './create-new-skill-modal.component';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {ValidatorsService} from 'services/validators.service';

class MockPlatformFeatureService {
  status = {
    EnableWorkedExamplesRteComponent: {
      isEnabled: false,
    },
  };
}

describe('Create new skill modal', () => {
  let fixture: ComponentFixture<CreateNewSkillModalComponent>;
  let componentInstance: CreateNewSkillModalComponent;
  let pageContextService: PageContextService;
  let testObj: SubtitledHtml = SubtitledHtml.createDefault(
    'test_html',
    'test_id'
  );
  let ngbActiveModal: NgbActiveModal;
  let skillEditorStateService: SkillEditorStateService;
  let skillCreationService: SkillCreationService;
  let platformFeatureService: PlatformFeatureService;
  let validatorsService: ValidatorsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [CreateNewSkillModalComponent],
      providers: [
        NgbActiveModal,
        ChangeDetectorRef,
        ValidatorsService,
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewSkillModalComponent);
    componentInstance = fixture.componentInstance;
    pageContextService = TestBed.inject(PageContextService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillCreationService = TestBed.inject(SkillCreationService);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    validatorsService = TestBed.inject(ValidatorsService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    spyOn(pageContextService, 'setImageSaveDestinationToLocalStorage');
    componentInstance.ngOnInit();
    expect(
      pageContextService.setImageSaveDestinationToLocalStorage
    ).toHaveBeenCalled();
  });

  it('should update explanation', () => {
    componentInstance.bindableDict.displayedConceptCardExplanation = 'text1';
    componentInstance.updateExplanation('text2');
    expect(
      componentInstance.bindableDict.displayedConceptCardExplanation
    ).toEqual('text2');
  });

  it('should open concept card explanation editor', () => {
    componentInstance.openConceptCardExplanationEditor();
    expect(componentInstance.conceptCardExplanationEditorIsShown).toBeTrue();
  });

  it('should get html schema when feature is disabled', () => {
    platformFeatureService.status.EnableWorkedExamplesRteComponent.isEnabled =
      false;
    const result = componentInstance.getHtmlSchema();
    expect(result).toEqual({
      type: 'html',
      ui_config: {
        rte_component_config_id: 'ALL_COMPONENTS',
      },
    });
  });

  it('should check if EnableWorkedexamplesRteComponent feature is enabled', () => {
    platformFeatureService.status.EnableWorkedExamplesRteComponent.isEnabled =
      true;
    expect(
      componentInstance.isEnableWorkedexamplesRteComponentFeatureEnabled()
    ).toBeTrue();

    platformFeatureService.status.EnableWorkedExamplesRteComponent.isEnabled =
      false;
    expect(
      componentInstance.isEnableWorkedexamplesRteComponentFeatureEnabled()
    ).toBeFalse();
  });

  it('should set error message if needed', () => {
    spyOn(validatorsService, 'hasValidDescription').and.returnValue(false);
    componentInstance.skillDescriptionExists = false;
    componentInstance.setErrorMessageIfNeeded();
    expect(componentInstance.errorMsg).toEqual(
      'Please use a non-empty description consisting of ' +
        'alphanumeric characters, spaces and/or hyphens.'
    );
    componentInstance.skillDescriptionExists = true;
    componentInstance.setErrorMessageIfNeeded();
    expect(componentInstance.errorMsg).toEqual(
      'This description already exists. Please choose a ' +
        'new name or modify the existing skill.'
    );
  });

  it('should update SkillDescription and check if exists', () => {
    spyOn(skillEditorStateService, 'updateExistenceOfSkillDescription');
    spyOn(skillCreationService, 'getSkillDescriptionStatus').and.returnValue(
      'not_disabled'
    );
    spyOn(skillCreationService, 'markChangeInSkillDescription');
    componentInstance.newSkillDescription = 'not_empty';
    componentInstance.updateSkillDescriptionAndCheckIfExists();
    componentInstance._skillDescriptionExistsCallback(false);
    expect(componentInstance.rubrics[1].getExplanations()).toEqual([
      componentInstance.newSkillDescription,
    ]);
    expect(
      skillCreationService.markChangeInSkillDescription
    ).toHaveBeenCalled();
    expect(componentInstance.skillDescriptionExists).toBeFalse();
  });

  it('should reset Error Message', () => {
    componentInstance.errorMsg = 'error_message';
    componentInstance.resetErrorMsg();
    expect(componentInstance.errorMsg).toBe('');
  });

  it('should return true if there are more than 2 workedexamples', () => {
    componentInstance.bindableDict.displayedConceptCardExplanation =
      '<oppia-noninteractive-workedexample>aasdfasdf</oppia-noninteractive-workedexample><oppia-noninteractive-workedexample>aasdfasdf</oppia-noninteractive-workedexample><oppia-noninteractive-workedexample>aasdfasdf</oppia-noninteractive-workedexample>';
    expect(componentInstance.checkExtraWorkedexample()).toEqual(true);
  });

  it('should return false if there are 2 or fewer workedexamples', () => {
    componentInstance.bindableDict.displayedConceptCardExplanation =
      '<oppia-noninteractive-workedexample>example1</oppia-noninteractive-workedexample><oppia-noninteractive-workedexample>example2</oppia-noninteractive-workedexample>';
    expect(componentInstance.checkExtraWorkedexample()).toEqual(false);
  });

  it('should save concept card explanation', () => {
    spyOn(SubtitledHtml, 'createDefault').and.returnValue(testObj);
    componentInstance.saveConceptCardExplanation();
    expect(
      componentInstance.bindableDict.displayedConceptCardExplanation
    ).toEqual('test_html');
    expect(componentInstance.newExplanationObject).toEqual({
      html: 'test_html',
      content_id: 'test_id',
    });
  });

  it('should create new skill modal', () => {
    spyOn(validatorsService, 'hasValidDescription').and.returnValue(true);
    componentInstance.skillDescriptionExists = false;
    spyOn(ngbActiveModal, 'close');
    componentInstance.createNewSkill();
    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      description: componentInstance.newSkillDescription,
      rubrics: componentInstance.rubrics,
      explanation: componentInstance.newExplanationObject,
    });
  });

  it('should not create new skill modal when there is a error message', () => {
    spyOn(componentInstance, 'setErrorMessageIfNeeded');
    spyOn(ngbActiveModal, 'close');
    componentInstance.errorMsg = 'not_empty';
    componentInstance.createNewSkill();
    expect(ngbActiveModal.close).toHaveBeenCalledTimes(0);
  });

  it('should cancel modal', () => {
    spyOn(ngbActiveModal, 'dismiss');
    componentInstance.cancel();
    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });
});
