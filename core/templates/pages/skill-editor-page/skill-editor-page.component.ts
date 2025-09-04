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
 * @fileoverview Component for the skill editor page.
 */

import {Component, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SavePendingChangesModalComponent} from 'components/save-pending-changes/save-pending-changes-modal.component';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {EntityEditorBrowserTabsInfoDomainConstants} from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info-domain.constants';
import {PageContextService} from 'services/page-context.service';
import {EntityEditorBrowserTabsInfo} from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import {Skill} from 'domain/skill/skill.model.ts';
import {QuestionsListService} from 'services/questions-list.service';
import {Subscription} from 'rxjs';
import {BottomNavbarStatusService} from 'services/bottom-navbar-status.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {LocalStorageService} from 'services/local-storage.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {SkillEditorRoutingService} from './services/skill-editor-routing.service';
import {SkillEditorStalenessDetectionService} from './services/skill-editor-staleness-detection.service';
import {SkillEditorStateService} from './services/skill-editor-state.service';
import {ConfirmQuestionExitModalComponent} from 'components/question-directives/modal-templates/confirm-question-exit-modal.component';
import {QuestionUndoRedoService} from 'domain/editor/undo_redo/question-undo-redo.service';

@Component({
  selector: 'oppia-skill-editor-page',
  templateUrl: './skill-editor-page.component.html',
})
export class SkillEditorPageComponent implements OnInit {
  constructor(
    private bottomNavbarStatusService: BottomNavbarStatusService,
    private localStorageService: LocalStorageService,
    private ngbModal: NgbModal,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private pageContextService: PageContextService,
    private questionsListService: QuestionsListService,
    private questionUndoRedoService: QuestionUndoRedoService,
    private skillEditorRoutingService: SkillEditorRoutingService,
    private skillEditorStateService: SkillEditorStateService,
    private skillEditorStalenessDetectionService: SkillEditorStalenessDetectionService,
    private undoRedoService: UndoRedoService,
    private urlService: UrlService,
    private windowRef: WindowRef
  ) {}

  skill: Skill;
  skillIsInitialized = false;
  directiveSubscriptions = new Subscription();
  warningsAreShown = false;

  getActiveTabName(): string {
    return this.skillEditorRoutingService.getActiveTabName();
  }

  navigationWithConfirmation(navigateFunction: () => void): void {
    // Check for any unsaved changes (skill changes or in-progress question)
    const hasUnsavedQuestionChanges = this.questionUndoRedoService.hasChanges();

    const hasUnsavedChanges = hasUnsavedQuestionChanges;
    if (hasUnsavedChanges) {
      const modalRef = this.ngbModal.open(ConfirmQuestionExitModalComponent, {
        backdrop: true,
      });

      modalRef.result.then(
        () => {
          navigateFunction();
          this.pageContextService.resetImageSaveDestination?.();
          this.skillEditorRoutingService.questionIsBeingCreated = false;
          this.questionUndoRedoService.clearChanges();
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
    } else {
      navigateFunction();
      this.questionUndoRedoService.clearChanges();
    }
  }

  selectMainTab(): void {
    if (this.skillEditorRoutingService.getActiveTabName() === 'questions') {
      this.navigationWithConfirmation(() => {
        this.skillEditorRoutingService.navigateToMainTab();
      });
    } else {
      this.skillEditorRoutingService.navigateToMainTab();
    }
  }

  selectPreviewTab(): void {
    if (this.skillEditorRoutingService.getActiveTabName() === 'questions') {
      this.navigationWithConfirmation(() => {
        this.skillEditorRoutingService.navigateToPreviewTab();
      });
    } else {
      this.skillEditorRoutingService.navigateToPreviewTab();
    }
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
        'Please save all pending changes ' +
        'before viewing the questions list.';

      modalRef.result.then(
        () => {},
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
    } else {
      this.skillEditorRoutingService.navigateToQuestionsTab();
    }
  }

  getWarningsCount(): number {
    return this.skill ? this.skill.getValidationIssues().length : 0;
  }

  onClosingSkillEditorBrowserTab(): void {
    const skill = this.skillEditorStateService.getSkill();

    const skillEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo =
      this.localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS,
        skill.getId()
      );

    if (
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges() &&
      this.undoRedoService.getChangeCount() > 0
    ) {
      skillEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(false);
    }
    skillEditorBrowserTabsInfo.decrementNumberOfOpenedTabs();

    this.localStorageService.updateEntityEditorBrowserTabsInfo(
      skillEditorBrowserTabsInfo,
      EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS
    );
  }

  createOrUpdateSkillEditorBrowserTabsInfo(): void {
    const skill = this.skillEditorStateService.getSkill();

    let skillEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo =
      this.localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS,
        skill.getId()
      );

    if (this.skillIsInitialized) {
      skillEditorBrowserTabsInfo.setLatestVersion(skill.getVersion());
      skillEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(false);
    } else {
      if (skillEditorBrowserTabsInfo !== null) {
        skillEditorBrowserTabsInfo.setLatestVersion(skill.getVersion());
        skillEditorBrowserTabsInfo.incrementNumberOfOpenedTabs();
      } else {
        skillEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
          'skill',
          skill.getId(),
          skill.getVersion(),
          1,
          false
        );
      }
      this.skillIsInitialized = true;
    }

    this.localStorageService.updateEntityEditorBrowserTabsInfo(
      skillEditorBrowserTabsInfo,
      EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS
    );
  }

  onCreateOrUpdateSkillEditorBrowserTabsInfo(event: StorageEvent): void {
    if (
      event.key ===
      EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS
    ) {
      this.skillEditorStalenessDetectionService.staleTabEventEmitter.emit();
      this.skillEditorStalenessDetectionService.presenceOfUnsavedChangesEventEmitter.emit();
    }
  }

  ngOnInit(): void {
    this.bottomNavbarStatusService.markBottomNavbarStatus(true);
    this.preventPageUnloadEventService.addListener(() => {
      return (
        this.undoRedoService.getChangeCount() > 0 ||
        this.questionUndoRedoService.hasChanges()
      );
    });
    this.skillEditorStateService.loadSkill(this.urlService.getSkillIdFromUrl());
    this.skill = this.skillEditorStateService.getSkill();
    this.directiveSubscriptions.add(
      this.skillEditorStateService.onSkillChange.subscribe(() => {
        this.createOrUpdateSkillEditorBrowserTabsInfo();
      })
    );
    this.skillIsInitialized = false;
    this.skillEditorStalenessDetectionService.init();
    this.windowRef.nativeWindow.addEventListener('beforeunload', event => {
      this.onClosingSkillEditorBrowserTab();
    });
    this.windowRef.nativeWindow.addEventListener('storage', event => {
      this.onCreateOrUpdateSkillEditorBrowserTabsInfo(event);
    });
  }
}
