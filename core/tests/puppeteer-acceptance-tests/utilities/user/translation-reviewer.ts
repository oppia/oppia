// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utilty class for translation submitter.
 */

import {ElementHandle} from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import {RTEEditor} from '../common/rte-editor';

// Common Selectors.
const activeTabSelector = '.e2e-test-active-tab';

// Contributor Dashboard Selectors.
const contributionTabSelector = '.e2e-test-contribution-tab';
const paginationBtnSelectorPrefix = '.e2e-test-pagination-button';

// Contribution Dashboard > Translate Text Tab Selectors.
const languageSelector = '.e2e-test-language-selector';
const selectedLanguageSelector = '.e2e-test-language-selector-selected';
const featuredLanguageOptionSelector = '.e2e-test-featured-language';
const languageOptionSelector = '.e2e-test-language-selector-option';
const topicSelector = '.e2e-test-topic-selector';
const selectedTopicSelector = '.e2e-test-topic-selector-selected';
const topicOptionSelector = '.e2e-test-topic-selector-option';
const opportunityItemSelector = '.e2e-test-opportunity-list-item';
const opportunityItemHeadingSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunitySubHeadingSelector =
  '.e2e-test-opportunity-list-item-subheading';
const opportunityTranslateButtonSelector =
  '.e2e-test-opportunity-list-item-button';
const translateTextModalHeaderContainerSelector =
  '.e2e-test-translate-text-header-container';
const textToTranslateContainerSelector = '.oppia-text-to-translate-container';
const skipTranslationButtonSelector = '.e2e-test-skip-translation-button';
const copyButtonSelector = '.e2e-test-copy-button';
const closeModalButtonSelector = '.e2e-test-close-modal-button';
const imageSelector = '.e2e-test-image';
const saveImageButtonSelector = '.e2e-test-close-rich-text-component-editor';
const textInputSelector = '.e2e-test-text-input';
const descriptionSelector = '.e2e-test-description-box';
const rteEditorBodySelector = '.e2e-test-rte';
const rteHelperModalContainerSelector = '.e2e-test-rte-helper-modal-container';
const skillNameInput = '.e2e-test-skill-name-input';
const skillItemInRTESelector = '.e2e-test-rte-skill-selector-item';
const contributionTableSelector = '.e2e-test-topics-table';

export class TranslationReviewer extends BaseUser {}

export let TranslationReviewerFactory = (): TranslationReviewer =>
  new TranslationReviewer();
