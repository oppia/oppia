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
 * @fileoverview Component for the skills list viewer.
 */

import {Component, Input} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {MergeSkillModalComponent} from 'components/skill-selector/merge-skill-modal.component';
import {BackendChangeObject} from 'domain/editor/undo_redo/change.model';
import {AugmentedSkillSummary} from 'domain/skill/augmented-skill-summary.model';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {SkillBackendApiService} from 'domain/skill/skill-backend-api.service';
import {SkillSummary} from 'domain/skill/skill-summary.model';
import {EditableTopicBackendApiService} from 'domain/topic/editable-topic-backend-api.service';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subscription} from 'rxjs';
import {AlertsService} from 'services/alerts.service';
import {AssignSkillToTopicModalComponent} from '../modals/assign-skill-to-topic-modal.component';
import {DeleteSkillModalComponent} from '../modals/delete-skill-modal.component';
import {
  TopicAssignmentsSummary,
  UnassignSkillFromTopicsModalComponent,
} from '../modals/unassign-skill-from-topics-modal.component';

export interface SkillsCategorizedByTopics {
  [topicName: string]: {
    [subtopicName: string]: ShortSkillSummary[];
  };
}

interface MergeModalResult {
  skill: AugmentedSkillSummary;
  supersedingSkillId: string;
}

@Component({
  selector: 'oppia-skills-list',
  templateUrl: './skills-list.component.html',
})
export class SkillsListComponent {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() skillSummaries!: AugmentedSkillSummary[];
  @Input() pageNumber!: number;
  @Input() itemsPerPage!: number;
  @Input() editableTopicSummaries!: CreatorTopicSummary[];
  @Input() mergeableSkillSummaries!: SkillSummary[];
  @Input() skillsCategorizedByTopics!: SkillsCategorizedByTopics;
  @Input() untriagedSkillSummaries!: SkillSummary[];
  @Input() userCanCreateSkill: boolean = true;
  @Input() userCanDeleteSkill: boolean = true;

  selectedIndex!: string;
  directiveSubscriptions: Subscription = new Subscription();
  SKILL_HEADINGS: string[] = [
    'index',
    'description',
    'worked_examples_count',
    'misconception_count',
    'status',
  ];

  constructor(
    private alertsService: AlertsService,
    private urlInterpolationService: UrlInterpolationService,
    private ngbModal: NgbModal,
    private editableTopicBackendApiService: EditableTopicBackendApiService,
    private skillBackendApiService: SkillBackendApiService,
    private topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService
  ) {}

  getSkillEditorUrl(skillId: string): string {
    let SKILL_EDITOR_URL_TEMPLATE: string = '/skill_editor/<skill_id>#/';
    return this.urlInterpolationService.interpolateUrl(
      SKILL_EDITOR_URL_TEMPLATE,
      {
        skill_id: skillId,
      }
    );
  }

  deleteSkill(skillId: string): void {
    let modalRef: NgbModalRef = this.ngbModal.open(DeleteSkillModalComponent, {
      backdrop: true,
      windowClass: 'delete-skill-modal',
    });

    modalRef.componentInstance.skillId = skillId;

    modalRef.result
      .then(
        () => {
          this.skillBackendApiService
            .deleteSkillAsync(skillId)
            .then(() => {
              setTimeout(() => {
                this.topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized.emit();
                let successToast = 'The skill has been deleted.';
                this.alertsService.addSuccessMessage(successToast, 1000);
              }, 100);
            })
            .catch((errorMessage: string) => {
              let errorToast: string;
              // This error is thrown as part of a final validation check in
              // the backend, hence the message does not include instructions
              // for the user to follow.
              if (errorMessage.includes('does not have any skills linked')) {
                errorToast =
                  'The skill is assigned to a subtopic in a published ' +
                  'topic. Please unpublish the topic before deleting ' +
                  'this skill.';
              } else {
                errorToast = errorMessage;
              }
              setTimeout(() => {
                this.topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized.emit();
              }, 100);
              this.alertsService.addInfoMessage(errorToast, 5000);
            });
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      )
      .then(() => {});
  }

  unassignSkill(skillId: string): void {
    let modalRef: NgbModalRef = this.ngbModal.open(
      UnassignSkillFromTopicsModalComponent,
      {
        backdrop: 'static',
      }
    );
    modalRef.componentInstance.skillId = skillId;
    modalRef.result.then(
      (topicsToUnassign: {[key: string]: TopicAssignmentsSummary}) => {
        for (let topic in topicsToUnassign) {
          let changeList: BackendChangeObject[] = [];
          if (topicsToUnassign[topic].subtopicId) {
            changeList.push({
              cmd: 'remove_skill_id_from_subtopic',
              subtopic_id: topicsToUnassign[topic].subtopicId,
              skill_id: skillId,
            });
          }

          changeList.push({
            cmd: 'remove_uncategorized_skill_id',
            uncategorized_skill_id: skillId,
          });

          this.editableTopicBackendApiService
            .updateTopicAsync(
              topicsToUnassign[topic].topicId,
              topicsToUnassign[topic].topicVersion,
              `Unassigned skill with id ${skillId} from the topic.`,
              changeList
            )
            .then(() => {
              setTimeout(() => {
                this.topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized.emit(
                  true
                );
              }, 100);
            })
            .then(() => {
              let successToast: string =
                'The skill has been unassigned to the topic.';
              this.alertsService.addSuccessMessage(successToast, 1000);
            });
        }
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  assignSkillToTopic(skill: AugmentedSkillSummary): void {
    let skillId: string = skill.id;
    let topicSummaries: CreatorTopicSummary[] =
      this.editableTopicSummaries.filter(
        topicSummary => !skill.topicNames.includes(topicSummary.name)
      );
    let modalRef: NgbModalRef = this.ngbModal.open(
      AssignSkillToTopicModalComponent,
      {
        backdrop: 'static',
        windowClass: 'assign-skill-to-topic-modal',
      }
    );
    modalRef.componentInstance.topicSummaries = topicSummaries;
    modalRef.result.then(
      (topicIds: string[]) => {
        let changeList: BackendChangeObject[] = [
          {
            cmd: 'add_uncategorized_skill_id',
            new_uncategorized_skill_id: skillId,
          },
        ];
        let topicSummaries: CreatorTopicSummary[] = this.editableTopicSummaries;
        for (let i = 0; i < topicIds.length; i++) {
          for (let j = 0; j < topicSummaries.length; j++) {
            if (topicSummaries[j].id === topicIds[i]) {
              this.editableTopicBackendApiService
                .updateTopicAsync(
                  topicIds[i],
                  topicSummaries[j].version,
                  'Added skill with id ' + skillId + ' to topic.',
                  changeList
                )
                .then(() => {
                  setTimeout(() => {
                    this.topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized.emit(
                      true
                    );
                  }, 100);
                })
                .then(() => {
                  let successToast =
                    'The skill has been assigned to the topic.';
                  this.alertsService.addSuccessMessage(successToast);
                });
            }
          }
        }
      },
      (topicIds?: string[]) => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        if (!topicIds) {
          return;
        }
        topicIds.forEach(topicId => {
          let topicIndex = this.editableTopicSummaries.findIndex(
            topic => topic.id === topicId
          );
          if (topicIndex !== -1) {
            (
              this.editableTopicSummaries[topicIndex] as CreatorTopicSummary & {
                isSelected: boolean;
              }
            ).isSelected = false;
          }
        });
      }
    );
  }

  mergeSkill(skill: AugmentedSkillSummary): void {
    let skillSummaries: SkillSummary[] = this.mergeableSkillSummaries;
    let categorizedSkills: SkillsCategorizedByTopics =
      this.skillsCategorizedByTopics;
    let untriagedSkillSummaries: SkillSummary[] = this.untriagedSkillSummaries;
    let allowSkillsFromOtherTopics: boolean = true;

    let modalRef: NgbModalRef = this.ngbModal.open(MergeSkillModalComponent, {
      backdrop: 'static',
      windowClass: 'skill-select-modal',
      size: 'xl',
    });
    modalRef.componentInstance.skillSummaries = skillSummaries;
    modalRef.componentInstance.skill = skill;
    modalRef.componentInstance.categorizedSkills = categorizedSkills;
    modalRef.componentInstance.allowSkillsFromOtherTopics =
      allowSkillsFromOtherTopics;
    modalRef.componentInstance.untriagedSkillSummaries =
      untriagedSkillSummaries;

    modalRef.result.then(
      (result: MergeModalResult) => {
        let skill: AugmentedSkillSummary = result.skill;
        let supersedingSkillId: string = result.supersedingSkillId;
        // Transfer questions from the old skill to the new skill.
        this.topicsAndSkillsDashboardBackendApiService
          .mergeSkillsAsync(skill.id, supersedingSkillId)
          .then(
            () => {
              // Broadcast will update the skills list in the dashboard so
              // that the merged skills are not shown anymore.
              setTimeout(() => {
                this.topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized.emit(
                  true
                );
                let successToast: string = 'Merged Skills.';
                this.alertsService.addSuccessMessage(successToast, 1000);
              }, 100);
            },
            errorResponse => {
              this.alertsService.addWarning(errorResponse);
            }
          );
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  getSerialNumberForSkill(skillIndex: number): number {
    const skillSerialNumber: number =
      skillIndex + this.pageNumber * this.itemsPerPage;
    return skillSerialNumber + 1;
  }

  changeEditOptions(skillId: string): void {
    this.selectedIndex = this.selectedIndex ? '' : skillId;
  }

  showEditOptions(skillId: string): boolean {
    return this.selectedIndex === skillId;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
