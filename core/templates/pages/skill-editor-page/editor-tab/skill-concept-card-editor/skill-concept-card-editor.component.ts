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
 * @fileoverview Component for the concept card editor.
 */

import { CdkDragSortEvent, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { WorkedExample } from 'domain/skill/worked-example.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AddWorkedExampleModalComponent } from 'pages/skill-editor-page/modal-templates/add-worked-example.component';
import { DeleteWorkedExampleComponent } from 'pages/skill-editor-page/modal-templates/delete-worked-example-modal.component';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { FormatRtePreviewPipe } from 'filters/format-rte-preview.pipe';
import { SkillPreviewModalComponent } from '../skill-preview-modal.component';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { AppConstants } from 'app.constants';

interface BindableFieldDict {
  displayedConceptCardExplanation: string;
  displayedWorkedExamples: WorkedExample[];
}

@Component({
  selector: 'oppia-skill-concept-card-editor',
  templateUrl: './skill-concept-card-editor.component.html'
})
export class SkillConceptCardEditorComponent implements OnInit {
  @Output() getConceptCardChange: EventEmitter<void> = new EventEmitter();
  directiveSubscriptions: Subscription = new Subscription();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  skill!: Skill;
  bindableFieldsDict!: BindableFieldDict;
  // Index can be null. It means that no worked example is active.
  // This also help in closing the worked example editor.
  activeWorkedExampleIndex!: number | null;
  isEditable: boolean = false;
  skillEditorCardIsShown: boolean = false;
  workedExamplesListIsShown: boolean = false;
  windowIsNarrow!: boolean;
  COMPONENT_NAME_WORKED_EXAMPLE = (
    AppConstants.COMPONENT_NAME_WORKED_EXAMPLE);

  constructor(
    private formatRtePreviewPipe: FormatRtePreviewPipe,
    private generateContentIdService: GenerateContentIdService,
    private ngbModal: NgbModal,
    private skillEditorStateService: SkillEditorStateService,
    private skillUpdateService: SkillUpdateService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  drop(event: CdkDragSortEvent<WorkedExample[]>): void {
    moveItemInArray(
      this.bindableFieldsDict.displayedWorkedExamples, event.previousIndex,
      event.currentIndex);
    this.skillUpdateService.updateWorkedExamples(
      this.skill, this.bindableFieldsDict.displayedWorkedExamples);
    this.getConceptCardChange.emit();
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  initBindableFieldsDict(): void {
    this.bindableFieldsDict = {
      displayedConceptCardExplanation:
        this.skill.getConceptCard().getExplanation().html,
      displayedWorkedExamples:
        this.skill.getConceptCard().getWorkedExamples()
    };
  }

  onSaveExplanation(explanationObject: SubtitledHtml): void {
    this.skillUpdateService.setConceptCardExplanation(
      this.skill, explanationObject);
  }

  onSaveDescription(): void {
    this.getConceptCardChange.emit();
  }

  changeActiveWorkedExampleIndex(idx: number): void {
    if (idx === this.activeWorkedExampleIndex) {
      this.bindableFieldsDict.displayedWorkedExamples = (
        this.skill.getConceptCard().getWorkedExamples());
      this.activeWorkedExampleIndex = null;
    } else {
      this.activeWorkedExampleIndex = idx;
    }
  }

  deleteWorkedExample(index: number, evt: string): void {
    this.ngbModal.open(DeleteWorkedExampleComponent, {
      backdrop: 'static'
    }).result.then(() => {
      this.skillUpdateService.deleteWorkedExample(this.skill, index);
      this.bindableFieldsDict.displayedWorkedExamples =
        this.skill.getConceptCard().getWorkedExamples();
      this.activeWorkedExampleIndex = null;
      this.getConceptCardChange.emit();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  getWorkedExampleSummary(workedExampleQuestion: string): string {
    const summary = this.formatRtePreviewPipe.transform(
      workedExampleQuestion);
    return summary;
  }

  openAddWorkedExampleModal(): void {
    this.ngbModal.open(AddWorkedExampleModalComponent, {
      backdrop: 'static'
    }).result.then((result) => {
      let newExample = WorkedExample.create(
        SubtitledHtml.createDefault(
          result.workedExampleQuestionHtml,
          this.generateContentIdService.getNextId(
            this.skill.getConceptCard().getRecordedVoiceovers(
            ).getAllContentIds(),
            this.COMPONENT_NAME_WORKED_EXAMPLE.QUESTION)),
        SubtitledHtml.createDefault(
          result.workedExampleExplanationHtml,
          this.generateContentIdService.getNextId(
            this.skill.getConceptCard().getRecordedVoiceovers(
            ).getAllContentIds(),
            this.COMPONENT_NAME_WORKED_EXAMPLE.EXPLANATION))
      );
      this.skillUpdateService.addWorkedExample(
        this.skill, newExample);
      this.bindableFieldsDict.displayedWorkedExamples = (
        this.skill.getConceptCard().getWorkedExamples());
      this.getConceptCardChange.emit();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  showSkillPreview(): void {
    let skillDescription = (
      this.skillEditorStateService.getSkill().getDescription());
    let skillExplanation = (
      this.bindableFieldsDict.displayedConceptCardExplanation);
    let skillWorkedExamples = (
      this.bindableFieldsDict.displayedWorkedExamples);
    const modalInstance: NgbModalRef = this.ngbModal.open(
      SkillPreviewModalComponent, {
        backdrop: true,
      });
    modalInstance.componentInstance.skillDescription = skillDescription;
    modalInstance.componentInstance.skillExplanation = skillExplanation;
    modalInstance.componentInstance.skillWorkedExamples = skillWorkedExamples;
    modalInstance.result.then(() => {}, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  toggleWorkedExampleList(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.workedExamplesListIsShown = (
        !this.workedExamplesListIsShown);
    }
  }

  toggleSkillEditorCard(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.skillEditorCardIsShown = !this.skillEditorCardIsShown;
    }
  }

  ngOnInit(): void {
    this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(
        () => {
          this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
          this.workedExamplesListIsShown = (
            !this.windowIsNarrow);
        }
      ));

    this.isEditable = true;
    this.skill = this.skillEditorStateService.getSkill();
    this.initBindableFieldsDict();
    this.skillEditorCardIsShown = true;
    this.workedExamplesListIsShown = (
      !this.windowDimensionsService.isWindowNarrow());
    this.directiveSubscriptions.add(
      this.skillEditorStateService.onSkillChange.subscribe(
        () => {
          this.initBindableFieldsDict();
        }
      )
    );
    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(
        () => {
          this.workedExamplesListIsShown = (
            !this.windowDimensionsService.isWindowNarrow()
          );
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaSkillConceptCardEditor',
downgradeComponent({
  component: SkillConceptCardEditorComponent
}) as angular.IDirectiveFactory);
