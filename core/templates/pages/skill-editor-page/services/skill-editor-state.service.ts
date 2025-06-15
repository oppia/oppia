// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for managing the state of the skill being edited
 * in the skill editor.
 */

import cloneDeep from 'lodash/cloneDeep';

import {EventEmitter, Injectable} from '@angular/core';

import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {SkillBackendApiService} from 'domain/skill/skill-backend-api.service';
import {SkillRights} from 'domain/skill/skill-rights.model';
import {SkillRightsBackendApiService} from 'domain/skill/skill-rights-backend-api.service';
import {SkillSummaryBackendDict} from 'domain/skill/skill-summary.model';
import {Skill} from 'domain/skill/SkillObjectFactory';
import {AlertsService} from 'services/alerts.service';
import {QuestionsListService} from 'services/questions-list.service';
import {LoaderService} from 'services/loader.service';

export interface AssignedSkillTopicData {
  [topicName: string]: string;
}
interface GroupedSkillSummaryDictionaries {
  [topicName: string]: SkillSummaryBackendDict[];
}

export interface GroupedSkillSummaries {
  current: {
    id: string;
    description: string;
  }[];
  others: SkillSummaryBackendDict[];
}
@Injectable({
  providedIn: 'root',
})
export class SkillEditorStateService {
  constructor(
    private alertsService: AlertsService,
    private questionsListService: QuestionsListService,
    private skillBackendApiService: SkillBackendApiService,
    private skillRightsBackendApiService: SkillRightsBackendApiService,
    private loaderService: LoaderService,
    private undoRedoService: UndoRedoService
  ) {}

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _skill!: Skill;
  private _skillRights!: SkillRights;
  private _skillIsInitialized: boolean = false;
  private _assignedSkillTopicData: AssignedSkillTopicData | null = null;
  private _skillIsBeingLoaded: boolean = false;
  private _skillIsBeingSaved: boolean = false;
  private _groupedSkillSummaries: GroupedSkillSummaries = {
    current: [],
    others: [],
  };

  private _skillChangedEventEmitter = new EventEmitter();

  private _setSkill = (skill: Skill) => {
    if (!this._skill) {
      // The skill is set directly for the first load.
      this._skill = skill;
    } else {
      // After first initialization, the skill object will be retained for
      // the lifetime of the editor and on every data reload or update, the new
      // contents will be copied into the same retained object.
      this._skill.copyFromSkill(skill);
    }
    this._skillIsInitialized = true;
    this._skillChangedEventEmitter.emit();
  };

  private _updateSkill = (skill: Skill) => {
    this._setSkill(skill);
  };

  private _updateGroupedSkillSummaries = (
    groupedSkillSummaries: GroupedSkillSummaryDictionaries
  ) => {
    let topicName = null;
    this._groupedSkillSummaries.current = [];
    this._groupedSkillSummaries.others = [];

    for (let name in groupedSkillSummaries) {
      const skillSummaries = groupedSkillSummaries[name];
      for (let idx in skillSummaries) {
        if (skillSummaries[idx].id === this._skill.getId()) {
          topicName = name;
          break;
        }
      }
      if (topicName !== null) {
        break;
      }
    }
    if (topicName !== null) {
      for (let idx in groupedSkillSummaries[topicName]) {
        this._groupedSkillSummaries.current.push(
          groupedSkillSummaries[topicName][idx]
        );
      }
    }
    for (let name in groupedSkillSummaries) {
      if (name === topicName) {
        continue;
      }
      const skillSummaries = groupedSkillSummaries[name];
      for (let idx in skillSummaries) {
        this._groupedSkillSummaries.others.push(skillSummaries[idx]);
      }
    }
  };

  private _setSkillRights = (skillRights: SkillRights) => {
    if (!this._skillRights) {
      // The skillRights is set directly for the first load.
      this._skillRights = skillRights;
    } else {
      // After first initialization, the skill Rights object will be retained
      // for the lifetime of the editor and on every data reload or update,
      // the new contents will be copied into the same retained object.
      this._skillRights.copyFromSkillRights(skillRights);
    }
  };

  private _updateSkillRights = (newSkillRightsObject: SkillRights) => {
    this._setSkillRights(newSkillRightsObject);
  };

  /**
   * Loads, or reloads, the skill stored by this service given a
   * specified collection ID. See setSkill() for more information on
   * additional behavior of this function.
   */
  loadSkill(skillId: string): void {
    this._skillIsBeingLoaded = true;
    this.loaderService.showLoadingScreen('Loading Skill Editor');
    let skillDataPromise = this.skillBackendApiService.fetchSkillAsync(skillId);
    let skillRightsPromise =
      this.skillRightsBackendApiService.fetchSkillRightsAsync(skillId);
    Promise.all([skillDataPromise, skillRightsPromise]).then(
      ([newBackendSkillObject, newSkillRightsObject]) => {
        this._updateSkillRights(newSkillRightsObject);
        this._assignedSkillTopicData =
          newBackendSkillObject.assignedSkillTopicData;
        this._updateSkill(newBackendSkillObject.skill);
        this._updateGroupedSkillSummaries(
          newBackendSkillObject.groupedSkillSummaries
        );
        this.questionsListService.getQuestionSummariesAsync(
          skillId,
          true,
          false
        );
        this._skillIsBeingLoaded = false;
        this.loaderService.hideLoadingScreen();
      },
      error => {
        this.alertsService.addWarning(error);
        this._skillIsBeingLoaded = false;
      }
    );
  }

  /**
   * Returns whether this service is currently attempting to load the
   * skill maintained by this service.
   */
  isLoadingSkill(): boolean {
    return this._skillIsBeingLoaded;
  }

  // 'getAssignedSkillTopicData()' will be return null if 'loadSkill()' did
  // not yet initialize '_assignedSkillTopicData' or failed to initialize it.
  getAssignedSkillTopicData(): AssignedSkillTopicData | null {
    return this._assignedSkillTopicData;
  }

  getGroupedSkillSummaries(): GroupedSkillSummaries {
    return cloneDeep(this._groupedSkillSummaries);
  }

  /**
   * Returns whether a skill has yet been loaded using either
   * loadSkill().
   */
  hasLoadedSkill(): boolean {
    return this._skillIsInitialized;
  }

  /**
   * Returns the current skill to be shared among the skill
   * editor. Please note any changes to this skill will be propogated
   * to all bindings to it. This skill object will be retained for the
   * lifetime of the editor. This function never returns null, though it may
   * return an empty skill object if the skill has not yet been
   * loaded for this editor instance.
   */
  getSkill(): Skill {
    return this._skill;
  }

  /**
   * Attempts to save the current skill given a commit message. This
   * function cannot be called until after a skill has been initialized
   * in this service. Returns false if a save is not performed due to no
   * changes pending, or true if otherwise. This function, upon success,
   * will clear the UndoRedoService of pending changes. This function also
   * shares behavior with setSkill(), when it succeeds.
   */
  saveSkill(
    commitMessage: string,
    successCallback: (value?: Object) => void
  ): boolean {
    if (!this._skillIsInitialized) {
      this.alertsService.fatalWarning(
        'Cannot save a skill before one is loaded.'
      );
    }
    // Don't attempt to save the skill if there are no changes pending.
    if (!this.undoRedoService.hasChanges()) {
      return false;
    }
    this._skillIsBeingSaved = true;

    this.skillBackendApiService
      .updateSkillAsync(
        this._skill.getId(),
        this._skill.getVersion(),
        commitMessage,
        this.undoRedoService.getCommittableChangeList()
      )
      .then(
        skill => {
          this._updateSkill(skill);
          this.undoRedoService.clearChanges();
          this._skillIsBeingSaved = false;
          if (successCallback) {
            successCallback();
          }
        },
        error => {
          this.alertsService.addWarning(
            error || 'There was an error when saving the skill'
          );
          this._skillIsBeingSaved = false;
        }
      );
    return true;
  }

  /**
   * Returns any validation issues associated with the current
   * skill.
   */
  getSkillValidationIssues(): string[] {
    return this._skill.getValidationIssues();
  }

  /**
   * Checks if the skill description exists and updates class
   * variable. `create-new-skill-modal.controller` will search
   * for that variable.
   */
  updateExistenceOfSkillDescription(
    description: string,
    successCallback: (skillDescriptionExists: boolean) => void
  ): void {
    this.skillBackendApiService
      .doesSkillWithDescriptionExistAsync(description)
      .then(
        skillDescriptionExists => {
          successCallback(skillDescriptionExists);
        },
        error => {
          this.alertsService.addWarning(
            error ||
              'There was an error when checking if the skill description ' +
                'exists for another skill.'
          );
        }
      );
  }

  get onSkillChange(): EventEmitter<string> {
    return this._skillChangedEventEmitter;
  }

  getSkillRights(): SkillRights {
    return this._skillRights;
  }

  isSavingSkill(): boolean {
    return this._skillIsBeingSaved;
  }

  setSkillRights(skillRights: SkillRights): void {
    this._setSkillRights(skillRights);
  }
}
