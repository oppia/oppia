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
 * @fileoverview Component for adding syllabus items to the learner group.
 */

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from
  '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';

import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { LanguageIdAndText, LanguageUtilService } from
  'domain/utilities/language-util.service';
import { NavigationService } from 'services/navigation.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConstructTranslationIdsService } from
  'services/construct-translation-ids.service';
import {
  LearnerGroupSyllabusFilter,
  LearnerGroupSyllabusBackendApiService,
  SyllabusSelectionDetails
} from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import { StorySummary } from 'domain/story/story-summary.model';
import { LearnerGroupSubtopicSummary } from
  'domain/learner_group/learner-group-subtopic-summary.model';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { AppConstants } from 'app.constants';

import './add-syllabus-items.component.css';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';

interface SearchDropDownItems {
  id: string;
  text: string;
}

@Component({
  selector: 'oppia-add-syllabus-items',
  templateUrl: './add-syllabus-items.component.html',
  styleUrls: ['./add-syllabus-items.component.css']
})
export class AddSyllabusItemsComponent implements OnInit, OnDestroy {
  @Input() learnerGroupId: string = '';
  @Input() learnerGroup!: LearnerGroupData;
  @Input() syllabusStorySummaries: StorySummary[] = [];
  @Input() syllabusSubtopicSummaries: LearnerGroupSubtopicSummary[] = [];
  @Input() syllabusStoryIds: string[] = [];
  @Input() syllabusSubtopicPageIds: string[] = [];
  @Output() updateLearnerGroupStoryIds:
    EventEmitter<string[]> = new EventEmitter();

  @Output() updateLearnerGroupSubtopicIds:
    EventEmitter<string[]> = new EventEmitter();

  @Output() updateLearnerGroupStories:
    EventEmitter<StorySummary[]> = new EventEmitter();

  @Output() updateLearnerGroupSubtopics:
    EventEmitter<LearnerGroupSubtopicSummary[]> = new EventEmitter();

  enableDropup = false;
  storySummaries: StorySummary[] = [];
  subtopicSummaries: LearnerGroupSubtopicSummary[] = [];
  searchBarPlaceholder!: string;
  categoryButtonText!: string;
  languageButtonText!: string;
  typeButtonText!: string;
  ACTION_OPEN!: string;
  ACTION_CLOSE!: string;
  SUPPORTED_CONTENT_LANGUAGES!: LanguageIdAndText[];
  SEARCH_DROPDOWN_TYPES!: SearchDropDownItems[];
  selectionDetails!: SyllabusSelectionDetails;
  SEARCH_DROPDOWN_CATEGORIES!: SearchDropDownItems[];
  directiveSubscriptions: Subscription = new Subscription();
  searchQuery: string = '';
  searchQueryChanged: Subject<string> = new Subject<string>();
  translationData: Record<string, number> = {};
  searchIsInProgress = false;
  syllabusFilter!: LearnerGroupSyllabusFilter;
  debounceTimeout = 1000;

  constructor(
    private windowDimensionsService: WindowDimensionsService,
    private translateService: TranslateService,
    private navigationService: NavigationService,
    private languageUtilService: LanguageUtilService,
    private constructTranslationIdsService: ConstructTranslationIdsService,
    private learnerGroupSyllabusBackendApiService:
      LearnerGroupSyllabusBackendApiService,
    private assetsBackendApiService: AssetsBackendApiService
  ) {}

  isMobileViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 766;
  }

  ngOnInit(): void {
    this.SEARCH_DROPDOWN_CATEGORIES = this.searchDropdownCategories();
    this.ACTION_OPEN = this.navigationService.ACTION_OPEN;
    this.ACTION_CLOSE = this.navigationService.ACTION_CLOSE;
    this.SUPPORTED_CONTENT_LANGUAGES = (
      this.languageUtilService.getLanguageIdsAndTexts());
    this.SEARCH_DROPDOWN_TYPES = this.searchDropdownTypes();
    this.selectionDetails = {
      types: {
        description: '',
        itemsName: 'types',
        masterList: this.SEARCH_DROPDOWN_TYPES,
        selection: '',
        defaultValue: 'All',
        summary: 'Type'
      },
      categories: {
        description: '',
        itemsName: 'categories',
        masterList: this.SEARCH_DROPDOWN_CATEGORIES,
        selection: '',
        defaultValue: 'All',
        summary: 'Category'
      },
      languageCodes: {
        description: '',
        itemsName: 'languages',
        masterList: this.SUPPORTED_CONTENT_LANGUAGES,
        selection: '',
        defaultValue: 'All',
        summary: 'Language'
      }
    };
    // Initialize the selection descriptions and summaries.
    for (let itemsType in this.selectionDetails) {
      this.updateSelectionDetails(itemsType);
    }

    this.refreshSearchBarLabels();

    this.searchQueryChanged
      .pipe(debounceTime(this.debounceTimeout))
      .pipe(distinctUntilChanged())
      .subscribe(value => {
        this.searchQuery = value;
        this.onSearchQueryChangeExec();
      });

    this.directiveSubscriptions.add(
      this.translateService.onLangChange
        .subscribe(() => this.refreshSearchBarLabels()));
  }

  // Update the description field of the relevant entry of selectionDetails.
  updateSelectionDetails(itemsType: string): void {
    let masterList = this.selectionDetails[itemsType].masterList;

    let selectedItemText = '';
    for (let i = 0; i < masterList.length; i++) {
      if (this.selectionDetails[itemsType].selection === masterList[i].id) {
        selectedItemText = masterList[i].text;
      }
    }

    if (selectedItemText.length > 0) {
      this.selectionDetails[itemsType].description = (
        this.translateService.instant(selectedItemText));
    } else {
      this.selectionDetails[itemsType].description = (
        this.selectionDetails[itemsType].summary
      );
    }
  }

  searchDropdownCategories(): SearchDropDownItems[] {
    return AppConstants.SEARCH_DROPDOWN_CLASSROOMS.map((classroomName) => {
      return {
        id: classroomName,
        text: this.constructTranslationIdsService.getClassroomTitleId(
          classroomName)
      };
    });
  }

  searchDropdownTypes(): SearchDropDownItems[] {
    return AppConstants.SEARCH_DROPDOWN_TYPES.map((typeName) => {
      return {
        id: typeName,
        text: this.constructTranslationIdsService.getSyllabusTypeTitleId(
          typeName)
      };
    });
  }

  toggleSelection(itemsType: string, optionName: string): void {
    let selection = this.selectionDetails[itemsType].selection;
    if (selection !== optionName) {
      this.selectionDetails[itemsType].selection = optionName;
    } else {
      this.selectionDetails[itemsType].selection = '';
    }

    this.updateSelectionDetails(itemsType);
    this.refreshSearchBarLabels();
    this.onSearchQueryChangeExec();
  }

  refreshSearchBarLabels(): void {
    // If you translate these strings in the html, then you must use a
    // filter because only the first 14 characters are displayed. That
    // would generate FOUC for languages other than English. As an
    // exception, we translate them here and update the translation
    // every time the language is changed.
    this.searchBarPlaceholder = this.translateService.instant(
      'I18N_ADD_SYLLABUS_SEARCH_PLACEHOLDER');
    // 'messageformat' is the interpolation method for plural forms.
    // http://angular-translate.github.io/docs/#/guide/14_pluralization.
    this.categoryButtonText = this.translateService.instant(
      this.selectionDetails.categories.description,
      {...this.translationData, messageFormat: true});
    this.languageButtonText = this.translateService.instant(
      this.selectionDetails.languageCodes.description,
      {...this.translationData, messageFormat: true});
    this.typeButtonText = this.translateService.instant(
      this.selectionDetails.types.description,
      {...this.translationData, messageFormat: true});
  }

  /**
   * Opens the submenu.
   * @param {KeyboardEvent} evt
   * @param {String} menuName - name of menu, on which
   * open/close action to be performed (category,language).
   */
  openSubmenu(evt: KeyboardEvent, menuName: string): void {
    this.navigationService.openSubmenu(evt, menuName);
  }

  onSearchQueryChangeExec(): void {
    this.searchIsInProgress = true;
    this.syllabusFilter = {
      learnerGroupId: this.learnerGroupId,
      keyword: this.searchQuery,
      type: (
        this.selectionDetails.types.selection ||
        this.selectionDetails.types.defaultValue
      ),
      category: (
        this.selectionDetails.categories.selection ||
        this.selectionDetails.categories.defaultValue
      ),
      languageCode: (
        this.selectionDetails.languageCodes.selection ||
        this.selectionDetails.languageCodes.defaultValue
      )
    };
    if (this.isValidSearch()) {
      this.learnerGroupSyllabusBackendApiService.searchNewSyllabusItemsAsync(
        this.syllabusFilter
      ).then((syllabusItems) => {
        this.searchIsInProgress = false;
        this.storySummaries = syllabusItems.storySummaries;
        this.subtopicSummaries = syllabusItems.subtopicPageSummaries;
      });
    } else {
      this.searchIsInProgress = false;
      this.storySummaries = [];
      this.subtopicSummaries = [];
    }
  }

  searchToBeExec(e: {target: {value: string}}): void {
    this.searchQueryChanged.next(e.target.value);
  }

  isValidSearch(): boolean {
    return (
      (this.searchQuery && this.searchQuery.length > 0) ||
      this.selectionDetails.types.selection.length > 0 ||
      this.selectionDetails.categories.selection.length > 0 ||
      this.selectionDetails.languageCodes.selection.length > 0
    );
  }

  isSearchInProgress(): boolean {
    return this.searchIsInProgress;
  }

  getSubtopicThumbnailUrl(
      subtopicSummary: LearnerGroupSubtopicSummary
  ): string {
    let thumbnailUrl = '';
    if (subtopicSummary.thumbnailFilename) {
      thumbnailUrl = (
        this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.TOPIC, subtopicSummary.parentTopicId,
          subtopicSummary.thumbnailFilename
        )
      );
    }
    return thumbnailUrl;
  }

  getStoryThumbnailUrl(storySummary: StorySummary): string {
    let thumbnailUrl = '';
    if (storySummary.getThumbnailFilename()) {
      thumbnailUrl = (
        this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.STORY, storySummary.getId(),
          storySummary.getThumbnailFilename()
        )
      );
    }
    return thumbnailUrl;
  }

  updateLearnerGroupSyllabus(): void {
    this.updateLearnerGroupStories.emit(this.syllabusStorySummaries);
    this.updateLearnerGroupSubtopics.emit(this.syllabusSubtopicSummaries);
    this.updateLearnerGroupStoryIds.emit(this.syllabusStoryIds);
    this.updateLearnerGroupSubtopicIds.emit(this.syllabusSubtopicPageIds);
  }

  addStoryToSyllabus(storySummary: StorySummary): void {
    this.syllabusStorySummaries.push(storySummary);
    this.syllabusStoryIds.push(storySummary.getId());
    this.updateLearnerGroupSyllabus();
  }

  addSubtopicToSyllabus(subtopicSummary: LearnerGroupSubtopicSummary): void {
    this.syllabusSubtopicSummaries.push(subtopicSummary);
    this.syllabusSubtopicPageIds.push(subtopicSummary.subtopicPageId);
    this.updateLearnerGroupSyllabus();
  }

  removeStoryFromSyllabus(storyId: string): void {
    this.syllabusStorySummaries = this.syllabusStorySummaries.filter(
      (s) => s.getId() !== storyId);
    this.syllabusStoryIds = this.syllabusStoryIds.filter(
      (id) => id !== storyId);
    this.updateLearnerGroupSyllabus();
  }

  removeSubtopicFromSyllabus(subtopicPageId: string): void {
    this.syllabusSubtopicSummaries = this.syllabusSubtopicSummaries.filter(
      (s) => s.subtopicPageId !== subtopicPageId);
    this.syllabusSubtopicPageIds = this.syllabusSubtopicPageIds.filter(
      (id) => id !== subtopicPageId);
    this.updateLearnerGroupSyllabus();
  }

  isStoryPartOfAddedSyllabus(storyId: string): boolean {
    return this.syllabusStoryIds.indexOf(storyId) !== -1;
  }

  isSubtopicPartOfAddedSyllabus(subtopicPageId: string): boolean {
    return this.syllabusSubtopicPageIds.indexOf(subtopicPageId) !== -1;
  }

  isStoryPartOfGroupSyllabus(storyId: string): boolean {
    return (
      this.learnerGroup && this.learnerGroup.storyIds.indexOf(storyId) !== -1
    );
  }

  isSubtopicPartOfGroupSyllabus(subtopicPageId: string): boolean {
    return (
      this.learnerGroup &&
      this.learnerGroup.subtopicPageIds.indexOf(subtopicPageId) !== -1
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'oppiaLearnerGroupDetails',
  downgradeComponent({component: AddSyllabusItemsComponent}));
