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
 * @fileoverview Component for the navbar of the skill editor.
 */

import {Subscription} from 'rxjs';
import {SkillEditorSaveModalComponent} from '../modal-templates/skill-editor-save-modal.component';
import {SavePendingChangesModalComponent} from 'components/save-pending-changes/save-pending-changes-modal.component';
import {Component, OnInit} from '@angular/core';
import {SkillEditorRoutingService} from '../services/skill-editor-routing.service';
import {SkillEditorStateService} from '../services/skill-editor-state.service';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {UrlService} from 'services/contextual/url.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AlertsService} from 'services/alerts.service';
import {Skill} from 'domain/skill/SkillObjectFactory';
import {SkillUpdateService} from 'domain/skill/skill-update.service';

@Component({
  selector: 'oppia-skill-editor-navbar',
  templateUrl: './skill-editor-navbar.component.html',
})
export class SkillEditorNavabarComponent implements OnInit {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  showNavigationOptions!: boolean;
  activeTab!: string;
  showSkillEditOptions!: boolean;
  skill!: Skill;

  constructor(
    private alertsService: AlertsService,
    private ngbModal: NgbModal,
    private skillEditorRoutingService: SkillEditorRoutingService,
    private skillEditorStateService: SkillEditorStateService,
    private skillUpdateService: SkillUpdateService,
    private undoRedoService: UndoRedoService,
    private urlService: UrlService
  ) {}

  directiveSubscriptions = new Subscription();
  ACTIVE_TAB_EDITOR = 'Editor';
  ACTIVE_TAB_QUESTIONS = 'Questions';
  ACTIVE_TAB_PREVIEW = 'Preview';

  getActiveTabName(): string {
    return this.skillEditorRoutingService.getActiveTabName();
  }

  isLoadingSkill(): boolean {
    return this.skillEditorStateService.isLoadingSkill();
  }

  isSaveInProgress(): boolean {
    return this.skillEditorStateService.isSavingSkill();
  }

  getChangeListCount(): number {
    return this.undoRedoService.getChangeCount();
  }

  discardChanges(): void {
    this.undoRedoService.clearChanges();
    this.skillEditorStateService.loadSkill(this.urlService.getSkillIdFromUrl());
  }

  getWarningsCount(): number {
    return this.skillEditorStateService.getSkillValidationIssues().length;
  }

  isSkillSaveable(): boolean {
    return this.getChangeListCount() > 0 && this.getWarningsCount() === 0;
  }

  saveChanges(): void {
    this.ngbModal
      .open(SkillEditorSaveModalComponent, {
        backdrop: 'static',
      })
      .result.then(
        commitMessage => {
          this.skillEditorStateService.saveSkill(commitMessage, () => {
            this.alertsService.addSuccessMessage('Changes Saved.');
          });
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  toggleNavigationOptions(): void {
    this.showNavigationOptions = !this.showNavigationOptions;
  }

  selectMainTab(): void {
    this.activeTab = this.ACTIVE_TAB_EDITOR;
    this.skillEditorRoutingService.navigateToMainTab();
  }

  selectPreviewTab(): void {
    this.activeTab = this.ACTIVE_TAB_PREVIEW;
    this.skillEditorRoutingService.navigateToPreviewTab();
  }

  toggleSkillEditOptions(): void {
    this.showSkillEditOptions = !this.showSkillEditOptions;
  }

  selectQuestionsTab(): void {
    // This check is needed because if a skill has unsaved changes to
    // misconceptions, then these will be reflected in the questions
    // created at that time, but if page is refreshed/changes are
    // discarded, the misconceptions won't be saved, but there will be
    // some questions with these now non-existent misconceptions.
    if (this.undoRedoService.getChangeCount() > 0) {
      const modalRef = this.ngbModal.open(SavePendingChangesModalComponent, {
        backdrop: true,
      });

      modalRef.componentInstance.body =
        'Please save all pending ' +
        'changes before viewing the questions list.';

      modalRef.result.then(null, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    } else {
      this.activeTab = this.ACTIVE_TAB_QUESTIONS;
      this.skillEditorRoutingService.navigateToQuestionsTab();
    }
  }

  ngOnInit(): void {
    this.activeTab = this.ACTIVE_TAB_EDITOR;
    this.directiveSubscriptions.add(
      this.skillEditorStateService.onSkillChange.subscribe(() => {
        this.skill = this.skillEditorStateService.getSkill();
      })
    );
    this.directiveSubscriptions.add(
      this.skillUpdateService.onPrerequisiteSkillChange.subscribe(() => {})
    );
    this.directiveSubscriptions.add(
      this.undoRedoService._undoRedoChangeEventEmitter.subscribe(() => {})
    );
  }
}
