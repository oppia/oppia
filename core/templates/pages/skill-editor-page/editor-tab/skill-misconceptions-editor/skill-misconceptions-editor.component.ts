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
 * @fileoverview Component for the skill misconceptions editor.
 */

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subscription } from 'rxjs';
import { AddMisconceptionModalComponent } from 'pages/skill-editor-page/modal-templates/add-misconception-modal.component';
import { DeleteMisconceptionModalComponent } from 'pages/skill-editor-page/modal-templates/delete-misconception-modal.component';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { Misconception } from 'domain/skill/MisconceptionObjectFactory';
import { Skill } from 'domain/skill/SkillObjectFactory';

@Component({
  selector: 'oppia-skill-misconceptions-editor',
  templateUrl: './skill-misconceptions-editor.component.html'
})
export class SkillMisconceptionsEditorComponent implements OnInit {
  @Output() getMisconceptionsChange = new EventEmitter();
  directiveSubscriptions = new Subscription();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  skill!: Skill;
  misconceptions!: Misconception[];
  // Active Miscellaneous Index is null if no misconception is active. It is
  // used to close the active misconception when the user again clicks on a
  // misconception.
  activeMisconceptionIndex!: number | null;
  misconceptionsListIsShown: boolean = false;
  skillEditorCardIsShown: boolean = false;
  isEditable: boolean = true;
  windowIsNarrow!: boolean;

  constructor(
    private ngbModal: NgbModal,
    private skillEditorStateService: SkillEditorStateService,
    private skillUpdateService: SkillUpdateService,
    private windowDimensionsService: WindowDimensionsService,
  ) {}

  ngOnInit(): void {
    this.skillEditorCardIsShown = true;
    this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(
        () => {
          this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
          this.misconceptionsListIsShown = (
            !this.windowDimensionsService.isWindowNarrow());
        }
      )
    );

    this.skill = this.skillEditorStateService.getSkill();
    this.misconceptionsListIsShown = (
      !this.windowDimensionsService.isWindowNarrow());
    this.misconceptions = this.skill.getMisconceptions();
    this.directiveSubscriptions.add(
      this.skillEditorStateService.onSkillChange.subscribe(
        () => this.misconceptions = this.skill.getMisconceptions())
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  changeActiveMisconceptionIndex(idx: number): void {
    if (idx === this.activeMisconceptionIndex) {
      this.activeMisconceptionIndex = null;
    } else {
      this.activeMisconceptionIndex = idx;
    }
  }

  getMisconceptionSummary(misconception: Misconception): string {
    return misconception.getName();
  }

  openDeleteMisconceptionModal(index: number, evt: string): void {
    const modalInstance: NgbModalRef = this.ngbModal.open(
      DeleteMisconceptionModalComponent, {
        backdrop: 'static',
      });
    modalInstance.componentInstance.index = index;
    modalInstance.result.then((result) => {
      this.skillUpdateService.deleteMisconception(this.skill, result.id);
      this.misconceptions = this.skill.getMisconceptions();
      this.activeMisconceptionIndex = null;
      this.getMisconceptionsChange.emit();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  openAddMisconceptionModal(): void {
    this.ngbModal.open(AddMisconceptionModalComponent, {
      backdrop: 'static'
    }).result.then((result) => {
      this.skillUpdateService.addMisconception(
        this.skill, result.misconception);
      this.misconceptions = this.skill.getMisconceptions();
      this.getMisconceptionsChange.emit();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  onMisconceptionChange(): void {
    this.getMisconceptionsChange.emit();
  }

  toggleMisconceptionLists(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.misconceptionsListIsShown = (
        !this.misconceptionsListIsShown);
    }
  }

  toggleSkillEditorCard(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.skillEditorCardIsShown = !this.skillEditorCardIsShown;
    }
  }
}

angular.module('oppia').directive('oppiaSkillMisconceptionsEditor',
  downgradeComponent({component: SkillMisconceptionsEditorComponent}));
