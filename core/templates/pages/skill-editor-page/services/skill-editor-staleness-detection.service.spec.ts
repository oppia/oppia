// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for skill editor staleness detection service.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { SkillBackendDict, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { WindowRef } from 'services/contextual/window-ref.service';
import { FaviconService } from 'services/favicon.service';
import { LocalStorageService } from 'services/local-storage.service';
import { StalenessDetectionService } from 'services/staleness-detection.service';
import { SkillEditorStalenessDetectionService } from './skill-editor-staleness-detection.service';
import { SkillEditorStateService } from './skill-editor-state.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      reload: () => {}
    }
  };
}

const skillContentsDict = {
  explanation: {
    html: 'test explanation',
    content_id: 'explanation',
  },
  worked_examples: [],
  recorded_voiceovers: {
    voiceovers_mapping: {
      explanation: {},
      worked_example_q_1: {},
      worked_example_e_1: {},
      worked_example_q_2: {},
      worked_example_e_2: {},
    },
  },
};

const skillDict: SkillBackendDict = {
  id: 'skill_id_1',
  description: 'Description',
  misconceptions: [{
    id: 2,
    name: 'test name',
    notes: 'test notes',
    feedback: 'test feedback',
    must_be_addressed: true,
  }],
  rubrics: [{
    difficulty: 'Easy',
    explanations: ['explanation'],
  }, {
    difficulty: 'Medium',
    explanations: ['explanation'],
  }, {
    difficulty: 'Hard',
    explanations: ['explanation'],
  }],
  skill_contents: skillContentsDict,
  language_code: 'en',
  version: 3,
  prerequisite_skill_ids: [],
  all_questions_merged: true,
  superseding_skill_id: '2',
  next_misconception_id: 3,
};

describe('Skill editor staleness detection service', () => {
  let skillEditorStalenessDetectionService:
  SkillEditorStalenessDetectionService;
  let skillObjectFactory: SkillObjectFactory;
  let skillEditorStateService: SkillEditorStateService;
  let localStorageService: LocalStorageService;
  let ngbModal: NgbModal;
  let faviconService: FaviconService;
  let mockWindowRef: MockWindowRef;
  let undoRedoService: UndoRedoService;
  let stalenessDetectionService: StalenessDetectionService;

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        StalenessDetectionService,
        SkillEditorStateService,
        FaviconService,
        LocalStorageService,
        UndoRedoService,
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }
      ]
    }).compileComponents();

    skillEditorStalenessDetectionService =
      TestBed.inject(SkillEditorStalenessDetectionService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    localStorageService = TestBed.inject(LocalStorageService);
    ngbModal = TestBed.inject(NgbModal);
    faviconService = TestBed.inject(FaviconService);
    undoRedoService = TestBed.inject(UndoRedoService);
    stalenessDetectionService = TestBed.inject(StalenessDetectionService);
  });

  it('should show stale tab info modal and change the favicon', () => {
    let skill = skillObjectFactory.createFromBackendDict(skillDict);
    spyOn(skillEditorStateService, 'getSkill').and.returnValue(skill);
    let skillEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(skillEditorBrowserTabsInfo);
    spyOn(mockWindowRef.nativeWindow.location, 'reload');
    spyOn(faviconService, 'setFavicon').and.callFake(() => {});
    spyOn(
      skillEditorStalenessDetectionService, 'showStaleTabInfoModal'
    ).and.callThrough();
    class MockNgbModalRef {
      result = Promise.resolve();
      componentInstance = {};
    }
    const ngbModalRef = new MockNgbModalRef() as NgbModalRef;
    spyOn(ngbModal, 'open').and.returnValue(ngbModalRef);

    skillEditorStalenessDetectionService.init();
    skillEditorStalenessDetectionService.staleTabEventEmitter.emit();

    expect(
      skillEditorStalenessDetectionService.showStaleTabInfoModal
    ).toHaveBeenCalled();
    expect(faviconService.setFavicon).toHaveBeenCalledWith(
      '/assets/images/favicon_alert/favicon_alert.ico');
    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should open or close presence of unsaved changes info modal ' +
  'depending on the presence of unsaved changes on some other tab', () => {
    let skill = skillObjectFactory.createFromBackendDict(skillDict);
    spyOn(skillEditorStateService, 'getSkill').and.returnValue(skill);
    let skillEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 2, true);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(skillEditorBrowserTabsInfo);
    spyOn(mockWindowRef.nativeWindow.location, 'reload');
    spyOn(
      skillEditorStalenessDetectionService, 'showPresenceOfUnsavedChangesModal'
    ).and.callThrough();
    class MockNgbModalRef {
      result = Promise.resolve();
      componentInstance = {};
      dismiss() {}
    }
    const ngbModalRef = new MockNgbModalRef() as NgbModalRef;
    spyOn(ngbModalRef, 'dismiss');
    spyOn(ngbModal, 'open').and.returnValue(ngbModalRef);
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);
    spyOn(
      stalenessDetectionService,
      'doesSomeOtherEntityEditorPageHaveUnsavedChanges'
    ).and.returnValues(true, false);

    skillEditorStalenessDetectionService.init();
    skillEditorStalenessDetectionService
      .presenceOfUnsavedChangesEventEmitter.emit();

    expect(
      skillEditorStalenessDetectionService.showPresenceOfUnsavedChangesModal
    ).toHaveBeenCalled();
    expect(ngbModal.open).toHaveBeenCalled();

    skillEditorStalenessDetectionService
      .presenceOfUnsavedChangesEventEmitter.emit();

    expect(ngbModalRef.dismiss).toHaveBeenCalled();
  });

  it('should not show the presence of unsaved changes modal on the page' +
  'which itself contains those unsaved changes', () => {
    class MockNgbModalRef {
      result = Promise.resolve();
      componentInstance = {};
      dismiss() {}
    }
    const ngbModalRef = new MockNgbModalRef() as NgbModalRef;
    spyOn(ngbModalRef, 'dismiss');
    spyOn(ngbModal, 'open').and.returnValue(ngbModalRef);
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);

    skillEditorStalenessDetectionService.init();
    skillEditorStalenessDetectionService
      .presenceOfUnsavedChangesEventEmitter.emit();

    expect(ngbModal.open).not.toHaveBeenCalled();
  });
});
