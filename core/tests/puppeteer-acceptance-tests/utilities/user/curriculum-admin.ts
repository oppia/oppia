// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Curriculum Admin users utility file.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const curriculumAdminThumbnailImage =
  testConstants.data.curriculumAdminThumbnailImage;
const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;
const baseURL = testConstants.URLs.BaseURL;

const richTextAreaField = 'div.e2e-test-rte';
const floatTextField = '.e2e-test-rule-details .e2e-test-float-form-input';
const solutionFloatTextField =
  'oppia-add-or-update-solution-modal .e2e-test-float-form-input';
const textStateEditSelector = 'div.e2e-test-state-edit-content';
const saveContentButton = 'button.e2e-test-save-state-content';

const modalDiv = 'div.modal-content';
const closeSaveModalButton = '.e2e-test-close-save-modal-button';

const photoBoxButton = 'div.e2e-test-photo-button';
const subtopicPhotoBoxButton =
  '.e2e-test-subtopic-thumbnail .e2e-test-photo-button';
const uploadPhotoButton = 'button.e2e-test-photo-upload-submit';
const photoUploadModal = 'edit-thumbnail-modal';

const createQuestionButton = 'div.e2e-test-create-question';
const removeQuestionConfirmationButton =
  '.e2e-test-remove-question-confirmation-button';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const interactionNumberInputButton =
  'div.e2e-test-interaction-tile-NumericInput';
const interactionNameDiv = 'div.oppia-interaction-tile-name';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const responseRuleDropdown =
  'oppia-rule-type-selector.e2e-test-answer-description';
const equalsRuleButtonText = 'is equal to ... ';
const answersInGroupAreCorrectToggle =
  'input.e2e-test-editor-correctness-toggle';
const saveResponseButton = 'button.e2e-test-add-new-response';
const defaultFeedbackTab = 'a.e2e-test-default-response-tab';
const openOutcomeFeedBackEditor = 'div.e2e-test-open-outcome-feedback-editor';
const saveOutcomeFeedbackButton = 'button.e2e-test-save-outcome-feedback';
const addHintButton = 'button.e2e-test-oppia-add-hint-button';
const saveHintButton = 'button.e2e-test-save-hint';
const addSolutionButton = 'button.e2e-test-oppia-add-solution-button';
const answerTypeDropdown = 'select.e2e-test-answer-is-exclusive-select';
const submitAnswerButton = 'button.e2e-test-submit-answer-button';
const submitSolutionButton = 'button.e2e-test-submit-solution-button';
const saveQuestionButton = 'button.e2e-test-save-question-button';

const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';

const topicsTab = 'a.e2e-test-topics-tab';
const desktopTopicSelector = 'a.e2e-test-topic-name';
const topicNameField = 'input.e2e-test-new-topic-name-field';
const topicUrlFragmentField = 'input.e2e-test-new-topic-url-fragment-field';
const topicWebFragmentField = 'input.e2e-test-new-page-title-fragm-field';
const topicDescriptionField = 'textarea.e2e-test-new-topic-description-field';
const createTopicButton = 'button.e2e-test-confirm-topic-creation-button';
const saveTopicButton = 'button.e2e-test-save-topic-button';
const topicMetaTagInput = '.e2e-test-topic-meta-tag-content-field';
const publishTopicButton = 'button.e2e-test-publish-topic-button';
const unpublishTopicButton = 'button.e2e-test-unpublish-topic-button';
const mobileUnpublishTopicButton = '.e2e-test-mobile-unpublish-topic-button';
const mobileNavbarDropdownOptions =
  '.oppia-topic-nav-topic-nav-dropdown-options';
const desktopTopicListItemSelector = '.list-item';
const mobileTopicListItemSelector = '.topic-item';
const desktopTopicListItemOptions = '.e2e-test-topic-edit-box';
const mobileTopicListItemOptions = '.e2e-test-mobile-topic-edit-box';
const desktopDeleteTopicButton = '.e2e-test-delete-topic-button';
const mobileDeleteTopicButton = '.e2e-test-mobile-delete-topic-button';
const confirmTopicDeletionButton = '.e2e-test-confirm-topic-deletion-button';

const addSubtopicButton = 'button.e2e-test-add-subtopic-button';
const subtopicTitleField = 'input.e2e-test-new-subtopic-title-field';
const subtopicUrlFragmentField =
  'input.e2e-test-new-subtopic-url-fragment-field';
const subtopicDescriptionEditorToggle = 'div.e2e-test-show-schema-editor';
const createSubtopicButton = '.e2e-test-confirm-subtopic-creation-button';
const subtopicNameSelector = '.e2e-test-subtopic-name';
const subtopicReassignHeader = 'div.subtopic-reassign-header';
const assignSubtopicButton = '.e2e-test-assign-subtopic';

const skillsTab = 'a.e2e-test-skills-tab';
const desktopSkillSelector = '.e2e-test-skill-description';
const skillDescriptionField = 'input.e2e-test-new-skill-description-field';
const skillReviewMaterialHeader = 'div.e2e-test-open-concept-card';
const addSkillButton = 'button.e2e-test-add-skill-button';
const confirmSkillCreationButton =
  'button.e2e-test-confirm-skill-creation-button';
const desktopSkillListItemOptions = '.e2e-test-skill-edit-box';
const desktopDeleteSkillButton = '.e2e-test-delete-skill-button';
const confirmSkillDeletionButton = '.e2e-test-confirm-skill-deletion-button';
const desktopSkillQuestionTab = '.e2e-test-questions-tab';
const mobileSkillQuestionTab = '.e2e-test-mobile-questions-tab';
const removeQuestion = '.link-off-icon';

const editSkillItemSelector = 'i.e2e-test-skill-item-edit-btn';
const confirmSkillAssignationButton =
  'button.e2e-test-skill-assign-subtopic-confirm';
const desktopSkillListItemSelector = '.list-item';
const mobileSkillListItemSelector = '.skill-item';
const mobileSkillListItemOptions = '.e2e-test-mobile-skills-option';
const mobileDeleteSkillButton = '.e2e-test-mobile-delete-skill-button';

const addDiagnosticTestSkillButton =
  'button.e2e-test-add-diagnostic-test-skill';
const diagnosticTestSkillSelector =
  'select.e2e-test-diagnostic-test-skill-selector';
const saveChangesMessageInput = 'textarea.e2e-test-commit-message-input';

const explorationSettingsTab = '.e2e-test-settings-tab';
const deleteExplorationButton = 'button.e2e-test-delete-exploration-button';
const confirmDeletionButton =
  'button.e2e-test-really-delete-exploration-button';

const mobileOptionsSelector = '.e2e-test-mobile-options-base';
const mobileTopicSelector = 'div.e2e-test-mobile-topic-name a';
const mobileSkillSelector = 'span.e2e-test-mobile-skill-name';

const mobileSaveTopicDropdown =
  'div.navbar-mobile-options .e2e-test-mobile-save-topic-dropdown';
const mobileSaveTopicButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-topic-button';
const mobilePublishTopicButton =
  'div.navbar-mobile-options .e2e-test-mobile-publish-topic-button';

const mobileNavToggelbutton = '.e2e-test-mobile-options';
const mobileOptionsDropdown = '.e2e-test-mobile-options-dropdown';
const mobileSettingsButton = 'li.e2e-test-mobile-settings-button';
const explorationControlsSettingsDropdown =
  'h3.e2e-test-controls-bar-settings-container';

export class CurriculumAdmin extends BaseUser {
  /**
   * Navigate to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage(): Promise<void> {
    await this.page.bringToFront();
    await this.page.waitForNetworkIdle();
    await this.goto(topicAndSkillsDashboardUrl);
  }

  /**
   * Create a skill for a particular topic.
   */
  async createSkillForTopic(
    description: string,
    topicName: string
  ): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(subtopicReassignHeader);
    }
    await this.clickOn(addSkillButton);
    await this.type(skillDescriptionField, description);
    await this.page.waitForSelector(skillReviewMaterialHeader);
    await this.clickOn(skillReviewMaterialHeader);
    await this.clickOn(richTextAreaField);
    await this.type(
      richTextAreaField,
      `Review material text content for ${description}.`
    );
    await this.page.waitForSelector(
      `${confirmSkillCreationButton}:not([disabled])`
    );
    await this.clickOn(confirmSkillCreationButton);
    await this.page.bringToFront();
  }

  /**
   * Add any number of questions to a particular skill.
   */
  async createQuestionsForSkill(
    skillName: string,
    questionCount: number
  ): Promise<void> {
    for (let i = 0; i < questionCount; i++) {
      await this.addBasicAlgebraQuestionToSkill(skillName);
    }
  }

  /**
   * Create a basic algebra question in the skill editor page.
   */
  async addBasicAlgebraQuestionToSkill(skillName: string): Promise<void> {
    await this.openSkillEditor(skillName);
    await this.clickOn(createQuestionButton);
    await this.clickOn(textStateEditSelector);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.type(richTextAreaField, 'Add 1+2');
    await this.page.waitForSelector(`${saveContentButton}:not([disabled])`);
    await this.clickOn(saveContentButton);

    await this.clickOn(addInteractionButton);
    await this.page.waitForSelector(interactionNumberInputButton, {
      visible: true,
    });
    await this.page.evaluate(interactionNameDiv => {
      const interactionDivs = Array.from(
        document.querySelectorAll(interactionNameDiv)
      );
      const element = interactionDivs.find(
        element => element.textContent?.trim() === 'Number Input'
      ) as HTMLElement;
      if (element) {
        element.click();
      } else {
        throw new Error('Cannot find number input interaction option.');
      }
    }, interactionNameDiv);

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector('oppia-add-answer-group-modal-component', {
      visible: true,
    });
    await this.clickOn(responseRuleDropdown);
    await this.clickOn(equalsRuleButtonText);
    await this.type(floatTextField, '3');
    await this.clickOn(answersInGroupAreCorrectToggle);
    await this.clickOn(saveResponseButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});

    await this.clickOn(defaultFeedbackTab);
    await this.clickOn(openOutcomeFeedBackEditor);
    await this.clickOn(richTextAreaField);
    await this.type(richTextAreaField, 'The answer is 3');
    await this.clickOn(saveOutcomeFeedbackButton);

    await this.clickOn(addHintButton);
    await this.page.waitForSelector(modalDiv, {visible: true});
    await this.type(richTextAreaField, '3');
    await this.clickOn(saveHintButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});

    await this.clickOn(addSolutionButton);
    await this.page.waitForSelector(modalDiv, {visible: true});
    await this.page.waitForSelector(answerTypeDropdown);
    await this.page.select(answerTypeDropdown, 'The only');
    await this.page.waitForSelector(solutionFloatTextField);
    await this.type(solutionFloatTextField, '3');
    await this.page.waitForSelector(`${submitAnswerButton}:not([disabled])`);
    await this.clickOn(submitAnswerButton);
    await this.type(richTextAreaField, '1+2 is 3');
    await this.page.waitForSelector(`${submitSolutionButton}:not([disabled])`);
    await this.clickOn(submitSolutionButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});

    await this.clickOn(saveQuestionButton);
  }

  /**
   * Create a topic in the topics-and-skills dashboard.
   */
  async createTopic(name: string, urlFragment: string): Promise<string> {
    await this.clickOn('Create Topic');
    await this.type(topicNameField, name);
    await this.type(topicUrlFragmentField, urlFragment);
    await this.type(topicWebFragmentField, name);
    await this.type(
      topicDescriptionField,
      `Topic creation description test for ${name}.`
    );

    await this.clickOn(photoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {visible: true});
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);
    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickOn(createTopicButton);

    await this.page.waitForSelector('.e2e-test-topics-table');
    await this.openTopicEditor(name);
    await this.page.waitForSelector(topicMetaTagInput);
    await this.page.focus(topicMetaTagInput);
    await this.page.type(topicMetaTagInput, 'meta');
    await this.page.keyboard.press('Tab');
    await this.saveTopicDraft(name);
    const topicUrl = this.page.url();
    let topicId = topicUrl
      .replace(/^.*\/topic_editor\//, '')
      .replace(/#\/.*/, '');

    return topicId;
  }

  /**
   * Open the topic editor page for a topic.
   */
  async openTopicEditor(topicName: string): Promise<void> {
    const topicNameSelector = this.isViewportAtMobileWidth()
      ? mobileTopicSelector
      : desktopTopicSelector;
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.clickOn(topicsTab);
    await this.page.waitForSelector(topicNameSelector, {visible: true});

    await Promise.all([
      this.page.evaluate(
        (topicNameSelector, topicName) => {
          const topicDivs = Array.from(
            document.querySelectorAll(topicNameSelector)
          );
          const topicDivToSelect = topicDivs.find(
            element => element?.textContent.trim() === topicName
          ) as HTMLElement;
          if (topicDivToSelect) {
            topicDivToSelect.click();
          } else {
            throw new Error('Cannot open topic editor page.');
          }
        },
        topicNameSelector,
        topicName
      ),
      this.page.waitForNavigation(),
    ]);
  }

  /**
   * Open the skill editor page for a skill.
   */
  async openSkillEditor(skillName: string): Promise<void> {
    const skillSelector = this.isViewportAtMobileWidth()
      ? mobileSkillSelector
      : desktopSkillSelector;
    await this.page.bringToFront();
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.clickOn(skillsTab);
    await this.page.waitForSelector(skillSelector, {visible: true});

    await Promise.all([
      this.page.evaluate(
        (skillSelector, skillName) => {
          const skillDivs = Array.from(
            document.querySelectorAll(skillSelector)
          );
          const skillDivToSelect = skillDivs.find(
            element => element?.textContent.trim() === skillName
          ) as HTMLElement;
          if (skillDivToSelect) {
            skillDivToSelect.click();
          } else {
            throw new Error('Cannot open skill editor page.');
          }
        },
        skillSelector,
        skillName
      ),
      this.page.waitForNavigation(),
    ]);
  }

  /**
   * Save a topic as a curriculum admin.
   */
  async saveTopicDraft(topicName: string): Promise<void> {
    await this.page.waitForSelector(modalDiv, {hidden: true});
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileSaveTopicButton);
      await this.page.waitForSelector('oppia-topic-editor-save-modal', {
        visible: true,
      });
      await this.type(
        saveChangesMessageInput,
        'Test saving topic as curriculum admin.'
      );
      await this.page.waitForSelector(
        `${closeSaveModalButton}:not([disabled])`
      );
      await this.clickOn(closeSaveModalButton);
      await this.page.waitForSelector('oppia-topic-editor-save-modal', {
        hidden: true,
      });
      await this.openTopicEditor(topicName);
    } else {
      await this.clickOn(saveTopicButton);
      await this.page.waitForSelector(modalDiv, {visible: true});
      await this.clickOn(closeSaveModalButton);
      await this.page.waitForSelector(modalDiv, {hidden: true});
    }
  }

  /**
   * Create a subtopic as a curriculum admin.
   */
  async createSubtopicForTopic(
    title: string,
    urlFragment: string,
    topicName: string
  ): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(subtopicReassignHeader);
    }
    await this.clickOn(addSubtopicButton);
    await this.type(subtopicTitleField, title);
    await this.type(subtopicUrlFragmentField, urlFragment);

    await this.clickOn(subtopicDescriptionEditorToggle);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.type(
      richTextAreaField,
      `Subtopic creation description text for ${title}`
    );

    await this.clickOn(subtopicPhotoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {visible: true});
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickOn(createSubtopicButton);
    await this.saveTopicDraft(topicName);
  }

  /**
   * Assign a skill to a subtopic in the topic editor page.
   */
  async assignSkillToSubtopicInTopicEditor(
    skillName: string,
    subtopicName: string,
    topicName: string
  ): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(subtopicReassignHeader);
    }

    await this.page.waitForSelector('div.e2e-test-skill-item', {visible: true});
    await this.page.evaluate(
      (skillName, topicName, editSkillItemSelector) => {
        const skillItemDivs = Array.from(
          document.querySelectorAll('div.e2e-test-skill-item')
        );
        const element = skillItemDivs.find(
          element => element.textContent?.trim() === skillName
        ) as HTMLElement;
        if (element) {
          const assignSkillButton = element.querySelector(
            editSkillItemSelector
          ) as HTMLElement;
          assignSkillButton.click();
        } else {
          throw new Error(
            `Cannot find skill called "${skillName}" in ${topicName}.`
          );
        }
      },
      skillName,
      topicName,
      editSkillItemSelector
    );

    await this.page.waitForSelector(assignSubtopicButton, {
      visible: true,
    });
    await this.clickOn('Assign to Subtopic');

    await this.page.waitForSelector(subtopicNameSelector, {visible: true});
    await this.page.evaluate(
      (subtopicName, subtopicNameSelector) => {
        const subtopicDivs = Array.from(
          document.querySelectorAll(subtopicNameSelector)
        );
        const element = subtopicDivs.find(
          element => element.textContent?.trim() === subtopicName
        ) as HTMLElement;
        if (element) {
          element.click();
        } else {
          throw new Error(
            `Cannot find subtopic called "${subtopicName}" to assign to skill.`
          );
        }
      },
      subtopicName,
      subtopicNameSelector
    );

    await this.page.waitForSelector(
      `${confirmSkillAssignationButton}:not([disabled])`
    );
    await this.clickOn(confirmSkillAssignationButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});
    await this.saveTopicDraft(topicName);
  }

  /**
   * Add a skill for diagnostic test and then publish the topic.
   * Adding a skill to diagnostic test is necessary for publishing the topic.
   */
  async addSkillToDiagnosticTest(
    skillName: string,
    topicName: string
  ): Promise<void> {
    await this.openTopicEditor(topicName);
    await this.clickOn(addDiagnosticTestSkillButton);
    await this.page.waitForSelector(diagnosticTestSkillSelector, {
      visible: true,
    });
    await this.clickOn(diagnosticTestSkillSelector);

    /**
     * We select the skill in the dropdown with this method because the event doesn't propagate
     * otherwise and no further changes are made to the DOM, even though the option is selected.
     */
    await this.page.evaluate(
      (optionValue, selectElemSelector) => {
        const selectElem = document.querySelector(
          selectElemSelector
        ) as HTMLSelectElement | null;
        if (!selectElem) {
          console.error('Select element not found');
          return;
        }

        const option = Array.from(selectElem.options).find(
          opt => opt.textContent?.trim() === optionValue
        ) as HTMLOptionElement | undefined;
        if (!option) {
          console.error('Option not found');
          return;
        }

        option.selected = true;
        const event = new Event('change', {bubbles: true});
        selectElem.dispatchEvent(event);
      },
      skillName,
      diagnosticTestSkillSelector
    );
    await this.saveTopicDraft(topicName);
  }

  async publishDraftTopic(topicName: string): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileSaveTopicDropdown);
      await this.page.waitForSelector(mobilePublishTopicButton);
      await this.clickOn(mobilePublishTopicButton);
    } else {
      await this.clickOn(publishTopicButton);
    }
  }

  /**
   * Check if the topic has been published successfully, by verifying
   * the status and the counts in the topics and skills dashboard.
   */
  async expectTopicToBePublishedInTopicsAndSkillsDashboard(
    topicName: string,
    expectedSubtopicCount: number,
    expectedSkillsCount: number
  ): Promise<void> {
    let topicDetails: {
      subtopicCount: string | null;
      skillsCount: string | null;
      topicStatus: string | null;
    };

    const newPage = await this.browserObject.newPage();
    if (this.isViewportAtMobileWidth()) {
      // This is the default viewport and user agent settings for iPhone 6.
      await newPage.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        isLandscape: false,
      });
      await newPage.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) ' +
          'AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 ' +
          'Mobile/15A372 Safari/604.1'
      );
    } else {
      await newPage.setViewport({width: 1920, height: 1080});
    }
    await newPage.bringToFront();
    await newPage.goto(topicAndSkillsDashboardUrl);

    if (this.isViewportAtMobileWidth()) {
      await newPage.waitForSelector('.e2e-test-mobile-topic-table', {
        visible: true,
      });
      topicDetails = await newPage.evaluate(topicName => {
        let items = Array.from(document.querySelectorAll('div.topic-item'));
        let expectedTopicItem = items.find(item => {
          return (
            item
              .querySelector('div.e2e-test-mobile-topic-name a')
              ?.textContent?.trim() === topicName
          );
        }) as HTMLElement;

        let tds = Array.from(
          expectedTopicItem.querySelectorAll('div.topic-item-value')
        ) as HTMLElement[];
        if (!tds || tds.length < 4) {
          throw new Error('Cannot fetch mobile topic details.');
        }

        return {
          subtopicCount: tds[1].innerText,
          skillsCount: tds[2].innerText,
          topicStatus: tds[3].innerText,
        };
      }, topicName);
    } else {
      await newPage.waitForSelector('.e2e-test-topics-table', {visible: true});
      topicDetails = await newPage.evaluate(topicName => {
        let items = Array.from(document.querySelectorAll('.list-item'));
        let expectedTopicItem = items.find(item => {
          return (
            item.querySelector('.e2e-test-topic-name')?.textContent?.trim() ===
            topicName
          );
        }) as HTMLElement;

        let tds = Array.from(expectedTopicItem.querySelectorAll('td'));
        if (!tds || tds.length < 5) {
          throw new Error('Cannot fetch topic details.');
        }

        return {
          subtopicCount: tds[3].innerText,
          skillsCount: tds[4].innerText,
          topicStatus: tds[5].innerText,
        };
      }, topicName);
    }

    expect(topicDetails.topicStatus).toEqual('Published');
    expect(topicDetails.subtopicCount).toEqual(
      expectedSubtopicCount.toString()
    );
    expect(topicDetails.skillsCount).toEqual(expectedSkillsCount.toString());
    showMessage('Topic has been published successfully!');
  }

  /**
   * Function to navigate to exploration editor
   * @param explorationUrl - url of the exploration
   */
  async navigateToExplorationEditor(
    explorationId: string | null
  ): Promise<void> {
    if (!explorationId) {
      throw new Error('Cannot navigate to editor: explorationId is null');
    }
    const editorUrl = `${baseURL}/create/${explorationId}`;
    await this.page.goto(editorUrl);
    showMessage('Navigation to exploration editor is successfull.');
  }

  /**
   * Function to navigate to exploration settings tab
   */
  async navigateToExplorationSettingsTab(): Promise<void> {
    await this.waitForPageToFullyLoad();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavToggelbutton);
      await this.clickOn(mobileOptionsDropdown);
      await this.clickOn(mobileSettingsButton);
    } else {
      await this.clickOn(explorationSettingsTab);
    }
    showMessage('Navigation to settings tab is successfull.');
  }

  /**
   * Deletes the exploration permanently.
   * Note: This action requires Curriculum Admin role.
   */
  async deleteExplorationPermanently(): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.clickOn(deleteExplorationButton);
    await this.clickOn(confirmDeletionButton);
  }

  /**
   * Function to dismiss welcome modal
   */
  async dismissWelcomeModal(): Promise<void> {
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      visible: true,
    });
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      hidden: true,
    });

    showMessage('Tutorial pop is closed.');
  }

  /**
   * Function to open control dropdown so that delete exploration button is visible
   * in mobile view.
   */
  async openExplorationControlDropdown(): Promise<void> {
    await this.clickOn(explorationControlsSettingsDropdown);
  }

  /**
   * Function to unpublish a topic.
   * @param {string} topicName - The name of the topic to unpublish.
   */
  async unpublishTopic(topicName: string): Promise<void> {
    await this.openTopicEditor(topicName);

    const isMobileWidth = this.isViewportAtMobileWidth();
    if (isMobileWidth) {
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileSaveTopicDropdown);
      await this.page.waitForSelector(mobileNavbarDropdownOptions);
      await this.clickOn(mobileUnpublishTopicButton);
      await this.page.reload({waitUntil: 'networkidle0'});
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileSaveTopicDropdown);
      await this.page.waitForSelector(mobileNavbarDropdownOptions);
    } else {
      await this.clickOn(unpublishTopicButton);
      await this.page.reload({waitUntil: 'networkidle0'});
    }

    const isTextPresent = await this.isTextPresentOnPage('Unpublish Topic');
    if (isTextPresent) {
      throw new Error('Topic is not unpublished successfully.');
    }
  }

  /**
   * Function to delete a topic.
   * @param {string} topicName - The name of the topic to delete.
   */
  async deleteTopic(topicName: string): Promise<void> {
    await this.page.goto(topicAndSkillsDashboardUrl);

    const isMobileWidth = this.isViewportAtMobileWidth();
    const topicListItemSelector = isMobileWidth
      ? mobileTopicListItemSelector
      : desktopTopicListItemSelector;
    const topicSelector = isMobileWidth
      ? mobileTopicSelector
      : desktopTopicSelector;
    const topicListItemOptions = isMobileWidth
      ? mobileTopicListItemOptions
      : desktopTopicListItemOptions;
    const deleteTopicButton = isMobileWidth
      ? mobileDeleteTopicButton
      : desktopDeleteTopicButton;

    await this.page.waitForSelector(topicListItemSelector);

    const topics = await this.page.$$(topicListItemSelector);
    for (let topic of topics) {
      const topicNameElement = await topic.$(topicSelector);
      if (topicNameElement) {
        const name = await (
          await topicNameElement.getProperty('textContent')
        ).jsonValue();

        if (name === ` ${topicName} `) {
          await this.page.waitForSelector(topicListItemOptions);
          const editBox = await topic.$(topicListItemOptions);
          if (editBox) {
            await this.waitForElementToBeClickable(editBox);
            await editBox.click();
            await this.page.waitForSelector(deleteTopicButton);
          } else {
            throw new Error('Edit button not found');
          }

          const deleteButton = await topic.$(deleteTopicButton);
          if (deleteButton) {
            await this.waitForElementToBeClickable(deleteButton);
            await deleteButton.click();
            await this.page.waitForSelector(confirmTopicDeletionButton);
          } else {
            throw new Error('Delete button not found');
          }

          const confirmButton = await this.page.$(confirmTopicDeletionButton);
          if (confirmButton) {
            await this.waitForElementToBeClickable(confirmButton);
            await confirmButton.click();
            await this.page.waitForSelector(modalDiv, {hidden: true});
          } else {
            throw new Error('Confirm button not found');
          }
          break;
        }
      }
    }
    showMessage(`Topic "${topicName}" has been successfully deleted.`);
  }

  /**
   * Function to check if a topic is not present in the Topics and Skills Dashboard.
   * @param {string} topicName - The name of the topic to check.
   */
  async expectTopicNotInTopicsAndSkillDashboard(
    topicName: string
  ): Promise<void> {
    await this.goto(topicAndSkillsDashboardUrl);
    const isTextPresent = await this.isTextPresentOnPage(
      'No topics or skills have been created yet.'
    );
    if (isTextPresent) {
      showMessage(`The skill "${topicName}" is not present on the Topics and Skills
      Dashboard as expected.`);
    }

    await this.clickOn(topicsTab);
    const isTopicPresent = await this.isTextPresentOnPage(topicName);
    if (isTopicPresent) {
      throw new Error(
        `Topic "${topicName}" was found.
          It was expected to be absent from Topics and Skills Dashboard.`
      );
    } else {
      showMessage(
        `The topic "${topicName}" is not present on the Topics and Skills
         Dashboard as expected.`
      );
    }
  }

  /**
   * Function to delete a skill.
   * @param {string} skillName - The name of the skill to delete.
   */
  async deleteSkill(skillName: string): Promise<void> {
    const isMobileWidth = this.isViewportAtMobileWidth();
    const skillSelector = isMobileWidth
      ? mobileSkillSelector
      : desktopSkillSelector;
    const skillListItemSelector = isMobileWidth
      ? mobileSkillListItemSelector
      : desktopSkillListItemSelector;
    const skillListItemOptions = isMobileWidth
      ? mobileSkillListItemOptions
      : desktopSkillListItemOptions;
    const deleteSkillButton = isMobileWidth
      ? mobileDeleteSkillButton
      : desktopDeleteSkillButton;

    await this.page.goto(topicAndSkillsDashboardUrl);
    await this.page.waitForSelector(skillsTab, {visible: true});
    await this.clickOn(skillsTab);
    await this.page.waitForSelector(skillSelector, {visible: true});
    await this.page.waitForSelector(skillListItemSelector, {visible: true});

    const skills = await this.page.$$(skillListItemSelector);
    for (let skill of skills) {
      const skillNameElement = await skill.$(skillSelector);
      if (skillNameElement) {
        const name = await (
          await skillNameElement.getProperty('textContent')
        ).jsonValue();

        if (name === `${skillName}`) {
          await skill.waitForSelector(skillListItemOptions, {visible: true});
          const editBox = await skill.$(skillListItemOptions);
          if (editBox) {
            await this.waitForElementToBeClickable(editBox);
            await editBox.click();
            await this.page.waitForSelector(deleteSkillButton);
          } else {
            throw new Error('Edit button not found');
          }

          const deleteButton = await skill.$(deleteSkillButton);
          if (deleteButton) {
            await this.waitForElementToBeClickable(deleteButton);
            await deleteButton.click();
            await this.page.waitForSelector(confirmSkillDeletionButton);
          } else {
            throw new Error('Delete button not found');
          }

          const confirmButton = await this.page.$(confirmSkillDeletionButton);
          if (confirmButton) {
            await this.waitForElementToBeClickable(confirmButton);
            await confirmButton.click();
            await this.page.waitForSelector(modalDiv, {hidden: true});
          } else {
            throw new Error('Confirm button not found');
          }
          break;
        }
      }
    }

    showMessage(`Skill "${skillName}" has been successfully deleted.`);
  }

  /**
   * Function to check if a skill is not present in the Topics and Skills Dashboard.
   * @param {string} skillName - The name of the skill to check.
   */
  async expectSkillNotInTopicsAndSkillsDashboard(
    skillName: string
  ): Promise<void> {
    await this.goto(topicAndSkillsDashboardUrl);
    const isTextPresent = await this.isTextPresentOnPage(
      'No topics or skills have been created yet.'
    );
    if (isTextPresent) {
      showMessage(`The skill "${skillName}" is not present on the Topics and Skills
      Dashboard as expected.`);
      return;
    }
    await this.clickOn(skillsTab);
    const isSkillPresent = await this.isTextPresentOnPage(skillName);
    if (isSkillPresent) {
      throw new Error(
        `Skill "${skillName}" was found.
          It was expected to be absent from Topics and Skills Dashboard.`
      );
    }
    showMessage(
      `The skill "${skillName}" is not present on the Topics and Skills
      Dashboard as expected.`
    );
  }

  /**
   * Function to delete all questions in a skill.
   * @param {string} skillName - The name of the skill to delete questions from.
   */
  async removeAllQuestionsFromTheSkill(skillName: string): Promise<void> {
    try {
      await this.openSkillEditor(skillName);

      const isMobileWidth = this.isViewportAtMobileWidth();
      const skillQuestionTab = isMobileWidth
        ? mobileSkillQuestionTab
        : desktopSkillQuestionTab;

      if (isMobileWidth) {
        const currentUrl = this.page.url();
        const questionsTabUrl = `${currentUrl}questions`;
        await this.goto(questionsTabUrl);
        await this.page.reload({waitUntil: 'networkidle0'});
      } else {
        await this.clickAndWaitForNavigation(skillQuestionTab);
      }

      while (true) {
        try {
          await this.page.waitForSelector(removeQuestion, {visible: true});
        } catch (error) {
          break;
        }

        let button = await this.page.$(removeQuestion);
        if (!button) {
          break;
        }

        await this.waitForElementToBeClickable(button);
        await button.click();

        try {
          await this.page.waitForSelector(modalDiv, {visible: true});
          await this.clickOn(removeQuestionConfirmationButton);
          await this.page.waitForSelector(modalDiv, {hidden: true});
        } catch (error) {
          console.error('Failed to remove question', error.stack);
          throw error;
        }

        await this.page.reload({waitUntil: 'networkidle0'});
      }

      showMessage(
        `All questions have been successfully removed from the skill "${skillName}".`
      );
    } catch (error) {
      console.error(
        `Failed to remove all questions from the skill "${skillName}"`,
        error.stack
      );
    }
  }
}

export let CurriculumAdminFactory = (): CurriculumAdmin =>
  new CurriculumAdmin();
