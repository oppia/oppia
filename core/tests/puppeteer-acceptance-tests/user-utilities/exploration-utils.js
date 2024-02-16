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
 * @fileoverview exploration management test file
 */

const baseUser = require(
    '../puppeteer-testing-utilities/puppeteer-utils.js');
  const testConstants = require(
    '../puppeteer-testing-utilities/test-constants.js');
  const { showMessage } = require(
    '../puppeteer-testing-utilities/show-message-utils.js');
const { text } = require('stream/consumers');

  const creatorDashboardUrl = 'http://localhost:8181/creator-dashboard';
  const createNewExplorationButton = '.e2e-test-create-new-exploration-button';
  const takeMeToEditorButton = '.e2e-test-dismiss-welcome-modal';
  const addCardName = '.e2e-test-state-name-text';
  const introSubmitButton = '.e2e-test-state-name-submit';
  const forButtonToBeEnabled = '.e2e-test-state-name-submit:not([disabled])';
  const introTitleSubmitButton = '.e2e-test-save-state-content';
  const interactionAddbutton = '.oppia-add-interaction-button';
  const endExplorationTab = 'img[src="/extensions/interactions/EndExploration/static/EndExploration.png"]';
  const saveInteractionButton = '.e2e-test-save-interaction';
  const basicSettingsTab = '.nav-link[aria-label="Exploration Setting Button"]';
  const addTitleBar = '.e2e-test-exploration-title-input';
  const addTitle = '.e2e-test-exploration-title-input';
  const addGoalBar = '.e2e-test-exploration-objective-input';
  const addGoal = '.e2e-test-exploration-objective-input';
  const cateogryDropDawn = '.mat-select-arrow-wrapper';
  const addCateogry = '#mat-option-67';
  const languageUpdateBar = '#mat-option-67';
  const addLanguage = '#mat-option-6';
  const addTags = '.e2e-test-chip-list-tags';
  const previewSummaryButton = '.e2e-test-open-preview-summary-modal';
  const dismissPreviewButton = '.e2e-test-close-preview-summary-modal';
  const textToSpeechToggle = 'label[for="text-speech-switch"]';

  const editbutton = '.e2e-test-edit-roles';
  const addUserName = 'label[for="newMemberUsername"]';
  const addRoleBar = '#mat-select-value-11';
  const ManagerRoleOption = '#mat-option-61';
  const saveRole = '.e2e-test-save-role';
    
module.exports = class e2eExplorationCreator extends baseUser{

  async createExploration(){
  
    await this.page.goto(creatorDashboardUrl); //working
    await this.clickOn(createNewExplorationButton); //working
    await this.clickOn(takeMeToEditorButton);//working
    await this.clickOn(addCardName); //working
    await this.type('.e2e-test-state-name-input', 'Test question'); //previous - input[name="title"]
    await this.page.waitForSelector(forButtonToBeEnabled);
    await this.clickOn(introSubmitButton);//working
    await this.clickOn('.e2e-test-edit-content-pencil-button');//(explicitly)working
    await this.type('.oppia-rte', 'Exploration intro text'); //working
    await this.clickOn(introTitleSubmitButton);//working
    await this.clickOn(interactionAddbutton);//working
    await this.clickOn(endExplorationTab);//working
    await this.clickOn(saveInteractionButton);//working

    showMessage('Successfully created a exploration!');
  }

  async goToBasicSettingsTab(){
    await this.clickOn(basicSettingsTab);//working
  }

  async updateBasicSettings(){
    await this.clickOn(addTitleBar); 
    await this.page.type(addTitle, 'Your Title Here');
    await this.clickOn(addGoalBar);
    await this.page.type(addGoal, 'Your Goal Here Please');
    await this.clickOn(cateogryDropDawn);
    await this.page.waitForSelector('.e2e-test-exploration-category-selector-choice');
    await this.clickOn(addCateogry);
    await this.clickOn(languageUpdateBar);
    await this.page.waitForSelector(addLanguage);
    await this.clickOn(addLanguage);

    await this.clickOn(addTags);
    await this.page.type('.e2e-test-chip-list-tags', 'Your Tag Here');
    showMessage('Successfully updated basic settings!');
  }

  async previewSummary(){
    await this.clickOn(previewSummaryButton);
    await this.clickOn(dismissPreviewButton);
  }

  async updateAdvancedSettings(){
    await this.clickOn(textToSpeechToggle);
    // await this.clickOn(feedbackToggle);
    showMessage('Successfully updated advanced settings!');
  }

  async inviteCollaborator(){
    // querry what username should be added as its saying `sorry we couldn't find the specific user`
    await this.clickOn(editbutton);
    await this.clickOn(addUserName);
    await this.page.type('.e2e-test-role-username', 'userAsCollaborator');
    await this.clickOn(addRoleBar);
    await this.clickOn(ManagerRoleOption);
    await this.clickOn(saveRole);
  }



} 
