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
 * @fileoverview Service to handle the updating of a skill.
 */

import cloneDeep from 'lodash/cloneDeep';

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {
  BackendChangeObject,
  Change,
} from 'domain/editor/undo_redo/change.model';
import { Misconception } from 'domain/skill/MisconceptionObjectFactory';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { SkillDomainConstants } from 'domain/skill/skill-domain.constants';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { WorkedExample } from 'domain/skill/WorkedExampleObjectFactory';
import { SubtitledHtml } from 'domain/exploration/SubtitledHtmlObjectFactory';

@Injectable({
  providedIn: 'root',
})
export class SkillUpdateService {
  constructor(private undoRedoService: UndoRedoService) {}

  private _applyChange = (
      skill,
      command: string,
      params,
      apply,
      reverse
  ) => {
    const changeDict = cloneDeep(params);
    changeDict.cmd = command;
    const changeObj = new Change(changeDict, apply, reverse);
    this.undoRedoService.applyChange(changeObj, skill);
  };

  private _applyPropertyChange = (
      skill,
      propertyName: string,
      newValue: string,
      oldValue: string,
      apply,
      reverse
  ) => {
    this._applyChange(
      skill,
      SkillDomainConstants.CMD_UPDATE_SKILL_PROPERTY,
      {
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue),
      },
      apply,
      reverse
    );
  };

  private _applyMisconceptionPropertyChange = (
      skill,
      misconceptionId: string,
      propertyName: string,
      newValue: string | boolean,
      oldValue: string | boolean,
      apply,
      reverse
  ) => {
    this._applyChange(
      skill,
      SkillDomainConstants.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
      {
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue),
        misconception_id: misconceptionId,
      },
      apply,
      reverse
    );
  };

  private _applyRubricPropertyChange = (
      skill,
      difficulty: string,
      explanations: string[],
      apply,
      reverse
  ) => {
    this._applyChange(
      skill,
      SkillDomainConstants.CMD_UPDATE_RUBRICS,
      {
        difficulty: cloneDeep(difficulty),
        explanations: cloneDeep(explanations),
      },
      apply,
      reverse
    );
  };

  private _applySkillContentsPropertyChange = (
      skill,
      propertyName: string,
      newValue,
      oldValue,
      apply,
      reverse
  ) => {
    this._applyChange(
      skill,
      SkillDomainConstants.CMD_UPDATE_SKILL_CONTENTS_PROPERTY,
      {
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue),
      },
      apply,
      reverse
    );
  };

  private _getParameterFromChangeDict = (
      changeDict: BackendChangeObject,
      paramName: string
  ) => changeDict[paramName];

  private _getNewPropertyValueFromChangeDict = (
      changeDict: BackendChangeObject
  ) => this._getParameterFromChangeDict(changeDict, 'new_value');

  setSkillDescription(skill: Skill, newDescription: string): void {
    let oldDescription = cloneDeep(skill.getDescription());
    this._applyPropertyChange(
      skill,
      SkillDomainConstants.SKILL_PROPERTY_DESCRIPTION,
      newDescription,
      oldDescription,
      (changeDict, skill) => {
        let description = this._getNewPropertyValueFromChangeDict(changeDict);
        skill.setDescription(description);
      },
      (changeDict, skill) => {
        skill.setDescription(oldDescription);
      }
    );
  }

  setConceptCardExplanation(skill: Skill, newExplanation: SubtitledHtml): void {
    const oldExplanation = skill.getConceptCard().getExplanation();
    this._applySkillContentsPropertyChange(
      skill,
      SkillDomainConstants.SKILL_CONTENTS_PROPERTY_EXPLANATION,
      newExplanation.toBackendDict(),
      oldExplanation.toBackendDict(),
      (changeDict, skill) => {
        skill.getConceptCard().setExplanation(newExplanation);
      },
      (changeDict, skill) => {
        skill.getConceptCard().setExplanation(oldExplanation);
      }
    );
  }

  addWorkedExample(skill: Skill, newWorkedExample: WorkedExample): void {
    const oldWorkedExamples = cloneDeep(
      skill.getConceptCard().getWorkedExamples()
    );
    const newWorkedExamples = cloneDeep(oldWorkedExamples);
    newWorkedExamples.push(newWorkedExample);
    this._applySkillContentsPropertyChange(
      skill,
      SkillDomainConstants.SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES,
      newWorkedExamples.map((workedExample) => {
        return workedExample.toBackendDict();
      }),
      oldWorkedExamples.map((workedExample) => workedExample.toBackendDict()),
      (changeDict, skill) => {
        skill.getConceptCard().setWorkedExamples(newWorkedExamples);
      },
      (changeDict, skill) => {
        skill.getConceptCard().setWorkedExamples(oldWorkedExamples);
      }
    );
  }

  deleteWorkedExample(skill: Skill, index: number): void {
    const oldWorkedExamples = cloneDeep(
      skill.getConceptCard().getWorkedExamples()
    );
    const newWorkedExamples = cloneDeep(oldWorkedExamples);
    newWorkedExamples.splice(index, 1);
    this._applySkillContentsPropertyChange(
      skill,
      SkillDomainConstants.SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES,
      newWorkedExamples.map((workedExample) => {
        return workedExample.toBackendDict();
      }),
      oldWorkedExamples.map((workedExample) => {
        return workedExample.toBackendDict();
      }),
      (changeDict, skill) => {
        skill.getConceptCard().setWorkedExamples(newWorkedExamples);
      },
      (changeDict, skill) => {
        skill.getConceptCard().setWorkedExamples(oldWorkedExamples);
      }
    );
  }

  updateWorkedExamples(skill: Skill, newWorkedExamples: WorkedExample[]): void {
    const oldWorkedExamples = skill.getConceptCard().getWorkedExamples();
    this._applySkillContentsPropertyChange(
      skill,
      SkillDomainConstants.SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES,
      newWorkedExamples.map((workedExample) => {
        return workedExample.toBackendDict();
      }),
      oldWorkedExamples.map((workedExample) => {
        return workedExample.toBackendDict();
      }),
      (changeDict, skill) => {
        skill.getConceptCard().setWorkedExamples(newWorkedExamples);
      },
      (changeDict, skill) => {
        skill.getConceptCard().setWorkedExamples(oldWorkedExamples);
      }
    );
  }

  updateWorkedExample(
      skill: Skill,
      workedExampleIndex: number,
      newWorkedExampleQuestionHtml: string,
      newWorkedExampleAnswerHtml: string
  ): void {
    const newWorkedExamples = cloneDeep(
      skill.getConceptCard().getWorkedExamples()
    );
    newWorkedExamples[workedExampleIndex]
      .getQuestion()
      .setHtml(newWorkedExampleQuestionHtml);
    newWorkedExamples[workedExampleIndex]
      .getExplanation()
      .setHtml(newWorkedExampleAnswerHtml);
    this.updateWorkedExamples(skill, newWorkedExamples);
  }

  addMisconception(skill: Skill, newMisconception: Misconception): void {
    const params = {
      new_misconception_dict: newMisconception.toBackendDict(),
    };

    const misconceptionId = newMisconception.getId();
    this._applyChange(
      skill,
      SkillDomainConstants.CMD_ADD_SKILL_MISCONCEPTION,
      params,
      (changeDict, skill) => {
        skill.appendMisconception(newMisconception);
      },
      (changeDict, skill) => {
        skill.deleteMisconception(misconceptionId);
      }
    );
  }

  deleteMisconception(skill: Skill, misconceptionId: string): void {
    const params = {
      misconception_id: misconceptionId,
    };
    const oldMisconception = skill.findMisconceptionById(misconceptionId);
    this._applyChange(
      skill,
      SkillDomainConstants.CMD_DELETE_SKILL_MISCONCEPTION,
      params,
      (changeDict, skill) => {
        skill.deleteMisconception(misconceptionId);
      },
      (changeDict, skill) => {
        skill.appendMisconception(oldMisconception);
      }
    );
  }

  addPrerequisiteSkill(skill: Skill, skillId: string): void {
    const params = {
      skill_id: skillId,
    };
    this._applyChange(
      skill,
      SkillDomainConstants.CMD_ADD_PREREQUISITE_SKILL,
      params,
      (changeDict, skill) => {
        skill.addPrerequisiteSkill(skillId);
      },
      (changeDict, skill) => {
        skill.deletePrerequisiteSkill(skillId);
      }
    );
  }

  deletePrerequisiteSkill(skill: Skill, skillId: string): void {
    const params = {
      skill_id: skillId,
    };
    this._applyChange(
      skill,
      SkillDomainConstants.CMD_DELETE_PREREQUISITE_SKILL,
      params,
      (changeDict, skill) => {
        skill.deletePrerequisiteSkill(skillId);
      },
      (changeDict, skill) => {
        skill.addPrerequisiteSkill(skillId);
      }
    );
  }

  updateMisconceptionName(
      skill: Skill,
      misconceptionId: string,
      oldName: string,
      newName: string
  ): void {
    const misconception = skill.findMisconceptionById(misconceptionId);
    if (misconception) {
      this._applyMisconceptionPropertyChange(
        skill,
        misconceptionId,
        SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_NAME,
        newName,
        oldName,
        () => {
          misconception.setName(newName);
        },
        () => {
          misconception.setName(oldName);
        }
      );
    }
  }

  updateMisconceptionMustBeAddressed(
      skill: Skill,
      misconceptionId: string,
      oldValue: boolean,
      newValue: boolean
  ): void {
    const misconception = skill.findMisconceptionById(misconceptionId);
    if (misconception) {
      this._applyMisconceptionPropertyChange(
        skill,
        misconceptionId,
        SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED,
        newValue,
        oldValue,
        () => {
          misconception.setMustBeAddressed(newValue);
        },
        () => {
          misconception.setMustBeAddressed(oldValue);
        }
      );
    }
  }

  updateMisconceptionNotes(
      skill: Skill,
      misconceptionId: string,
      oldNotes: string,
      newNotes: string
  ): void {
    const misconception = skill.findMisconceptionById(misconceptionId);
    if (misconception) {
      this._applyMisconceptionPropertyChange(
        skill,
        misconceptionId,
        SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_NOTES,
        newNotes,
        oldNotes,
        () => {
          misconception.setNotes(newNotes);
        },
        () => {
          misconception.setNotes(oldNotes);
        }
      );
    }
  }

  updateMisconceptionFeedback(
      skill: Skill,
      misconceptionId: string,
      oldFeedback: string,
      newFeedback: string
  ): void {
    const misconception = skill.findMisconceptionById(misconceptionId);
    if (misconception) {
      this._applyMisconceptionPropertyChange(
        skill,
        misconceptionId,
        SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK,
        newFeedback,
        oldFeedback,
        () => {
          misconception.setFeedback(newFeedback);
        },
        () => {
          misconception.setFeedback(oldFeedback);
        }
      );
    }
  }

  updateRubricForDifficulty(
      skill: Skill,
      difficulty: string,
      explanations: string[]
  ): void {
    if (skill.SKILL_DIFFICULTIES.indexOf(difficulty) === -1) {
      throw new Error('Invalid difficulty value passed');
    }
    const oldExplanations = skill.getRubricExplanations(difficulty);
    this._applyRubricPropertyChange(
      skill,
      difficulty,
      explanations,
      (changeDict, skill) => {
        skill.updateRubricForDifficulty(difficulty, explanations);
      },
      (changeDict, skill) => {
        skill.updateRubricForDifficulty(difficulty, oldExplanations);
      }
    );
  }
}

angular.module('oppia')
  .factory('SkillUpdateService', downgradeInjectable(SkillUpdateService));
