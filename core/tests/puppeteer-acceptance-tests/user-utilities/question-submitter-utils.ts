// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Question submitter users utility file.
 */

import {IBaseUser} from '../puppeteer-testing-utilities/puppeteer-utils';
import testConstants from '../puppeteer-testing-utilities/test-constants';

export interface IQuestionSubmitter extends IBaseUser {
  navigateToContributorDashboard: () => Promise<void>;
}

export interface SkillOpportunity {
  skillDescription: string;
  topicName: string;
}

export interface SkillDifficulty {
  rubricExplanations: string[];
}

class QuestionSubmitter implements IQuestionSubmitter {
  async navigateToContributorDashboard(): Promise<void> {
    const contributorDashboardUrl = testConstants.URLs.ContributorDashboard;
    await this.goto(contributorDashboardUrl);
  }

  async navigateToSubmitQuestionsTab(): Promise<void> {
    await this.clickOn('.e2e-test-submitQuestionTab');
    await this.page.waitForSelector('oppia-contributions-and-review', {
      hidden: true,
    });
    await this.page.waitForSelector('oppia-question-opportunities', {
      visible: true,
    });
  }

  async expectSkillOpportunityToBeSuggestable(
    opportunity: SkillOpportunity
  ): Promise<void> {
    await this.page.waitForNetworkIdle({waitUntil: 2000});

    const opportunityListItem =
      await this.getOpportunityListItemSelector(opportunity);

    if (
      this.page.$(
        opportunityListItem + ' .e2e-test-opportunity-list-item-button:enabled'
      )
    ) {
      showMessage(
        'The skill opportunity with ' +
          `topic name "${opportunity.topicName}" and ` +
          `skill description "${opportunity.skillDescription}" ` +
          'is open to question suggestions.'
      );
    } else {
      throw new Error(
        'The skill opportunity with ' +
          `topic name "${opportunity.topicName}" and ` +
          `skill description "${opportunity.skillDescription}" ` +
          'is open to question suggestions.'
      );
    }
  }

  private async getOpportunityListItemSelector({
    skillDescription,
    topicName,
  }: SkillOpportunity): Promise<string> {
    const opportunityCount = await this.page.$$eval(
      '.oppia-opportunities-list',
      async opportunitiesList =>
        opportunitiesList.filter(
          opportunity => opportunity.classList.length === 0
        ).length
    );

    for (let i = 0; i < opportunityCount; i++) {
      const opportunitySelector =
        '.e2e-test-opportunity-list > ' + `:nth-child(${i + 1})`;

      const opportunityHasSkillDescription = await this.page.$eval(
        `${opportunitySelector} .e2e-test-opportunity-list-item-heading`,
        (opportunityHeading, skillDescription) =>
          opportunityHeading.innerText === skillDescription,
        skillDescription
      );
      const opportunityHasTopicName = await this.page.$eval(
        `${opportunitySelector} .e2e-test-opportunity-list-item-subheading`,
        (opportunitySubheading, topicName) =>
          opportunitySubheading.innerText === topicName,
        topicName
      );

      if (opportunityHasSkillDescription && opportunityHasTopicName) {
        return opportunitySelector;
      }
    }
    throw new Error(
      'The skill opportunity with ' +
        `topic name "${topicName}" and ` +
        `skill description "${skillDescription}" ` +
        'is not listed.'
    );
  }

  async suggestQuestionForSkillOpportunity(
    opportunity: SkillOpportunity
  ): Promise<void> {
    const opportunityListItem =
      await this.getOpportunityListItemSelector(opportunity);

    await this.clickOn(
      opportunityListItem + '.e2e-test-opportunity-list-item-button:enabled'
    );
    await this.page.waitForSelector(
      'oppia-questions-opportunities-select-difficulty-modal',
      {visible: true}
    );
  }

  async expectQuestionDifficultyChoices(difficulties: {
    [difficulty: string]: SkillDifficulty;
  }): Promise<void> {
    for (const [difficulty, {rubricExplanations}] of difficulties.entries()) {
      const difficultyChoice = getDifficultyChoiceSelector(difficulty);

      // Check if the choice difficulty label is present.
      if (
        (await this.page.$eval(
          `${difficultyChoice} .e2e-test-skill-difficulty-name`,
          difficultyName => difficultyName.innerText
        )) !== difficulty
      ) {
        throw new Error(
          `Difficulty "${difficulty}" is not an available option to select.`
        );
      }

      // Check that each difficulty rubric explanation is present.
      for (const [i, explanation] of rubricExplanations.entries()) {
        if (
          (await this.page.$eval(
            `${difficultyChoice} mat-list > :nth-child(${i + 1}) ` +
              '.e2e-test-skill-rubric-explanation',
            choiceExplanation => choiceExplanation.innerText
          )) !== explanation
        ) {
          throw new Error(
            `Rubric explanation "${explanation}" does not show up under ` +
              `difficulty option "${difficulty}".`
          );
        }
      }
    }

    showMessage(
      'All skill difficulties with their rubric explanations ' +
        'appear as choices.'
    );
  }

  private getDifficultyChoiceSelector(difficulty: string): string {
    return `.e2e-test-skill-difficulty-${difficulty}`;
  }

  async chooseDifficulty(difficulty: string): Promise<void> {
    // Select the option corresponding to the given difficulty.
    await this.clickOn(getDifficultyChoiceSelector(difficulty));

    // Click on the Continue button.
    await this.clickOn('.e2e-test-confirm-skill-difficulty-button');
    await this.page.waitForSelector(
      'oppia-questions-opportunities-select-difficulty-modal',
      {hidden: true}
    );
    await this.page.waitForSelector('oppia-question-suggestion-editor-modal', {
      visible: true,
    });
  }

  async expectChosenDifficultyToBe({
    difficulties,
    difficultyName,
  }: {
    difficulties: {[difficulty: string]; SkillDifficulty};
    difficultyName: string;
  }): Promise<void> {
    // Verify selected difficulty name
    const selectedDifficultyText = await this.page.$eval(
      '.e2e-test-selected-difficulty-rubric-explanation-list',
      selectedDifficulty => selectedDifficulty.innerText
    );
    if (!selectedDifficultyText.includes(difficultyName)) {
      const selectedDifficultyPrefix = 'Selected Difficulty: ';
      const selectedDifficultyName = selectedDifficultyText.substring(
        selectedDifficultyPrefix.length
      );
      throw new Error(
        `Selected difficulty was "${selectedDifficultyName}" ` +
          `instead of "${difficultyName}".`
      );
    }

    // Verify rubric notes
    for (const [i, explanation] of difficulties[
      difficultyName
    ].rubricExplanations.entries()) {
      if (
        (await this.page.$eval(
          '.e2e-test-selected-difficulty-rubric-explanation-list > ' +
            `:nth-child(${i + 1}) ` +
            '.e2e-test-selected-difficulty-rubric-explanation',
          noteExplanation => choiceExplanation.innerText
        )) !== explanation
      ) {
        throw new Error(
          `Rubric explanation "${explanation}" does not show up under ` +
            `rubric notes when selecting difficulty "${difficultyName}".`
        );
      }
    }
    showMessage(`The selected difficulty is ${difficultyName}`);
  }
}

export let QuestionSubmitterFactory = (): IQuestionSubmitter => {
  return new QuestionSubmitter();
};
