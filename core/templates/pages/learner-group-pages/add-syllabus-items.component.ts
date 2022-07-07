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
 * @fileoverview Component for the subtopic viewer.
 */

 import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
 import { downgradeComponent } from '@angular/upgrade/static';
 import { TranslateService } from '@ngx-translate/core';
 import { Subject, Subscription } from 'rxjs';
 
 import { AppConstants } from 'app.constants';
 import { SubtopicViewerBackendApiService } from 'domain/subtopic_viewer/subtopic-viewer-backend-api.service';
 import { SubtopicPageContents } from 'domain/topic/subtopic-page-contents.model';
 import { Subtopic } from 'domain/topic/subtopic.model';
 import { AlertsService } from 'services/alerts.service';
 import { ContextService } from 'services/context.service';
 import { UrlService } from 'services/contextual/url.service';
 import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
 import { I18nLanguageCodeService, TranslationKeyType } from 'services/i18n-language-code.service';
 import { LoaderService } from 'services/loader.service';
 import { PageTitleService } from 'services/page-title.service';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { LearnerGroupPagesConstants } from './learner-group-pages.constants';
import { LanguageIdAndText, LanguageUtilService } from 'domain/utilities/language-util.service';
import { SearchService, SelectionDetails } from 'services/search.service';
import { NavigationService } from 'services/navigation.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import constants from 'assets/constants';
import { ConstructTranslationIdsService } from 'services/construct-translation-ids.service';
import { LearnerGroupSyllabusFilter, LearnerGroupSyllabusBackendApiService } 
  from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import { StorySummary } from 'domain/story/story-summary.model';
import { SubtopicPageSummary } from 'domain/learner_group/subtopic-page-summary.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

interface SearchDropDownItems {
  id: string;
  text: string;
}
 
@Component({
  selector: 'oppia-add-syllabus-items',
  templateUrl: './add-syllabus-items.component.html'
})
export class AddSyllabusItemsComponent implements OnInit, OnDestroy {
  @Output() updateLearnerGroupStories: EventEmitter<string[]> = new EventEmitter();
  @Output() updateLearnerGroupSubtopics: EventEmitter<string[]> = new EventEmitter();
  syllabusStoryIds: string[] = [];
  syllabusSubtopicPageIds: string[] = [];
  syllabusStorySummaries: StorySummary[] = [];
  syllabusSubtopicSummaries: SubtopicPageSummary[] = [];
  searchBarPlaceholder!: string;
  categoryButtonText!: string;
  languageButtonText!: string;
  typeButtonText!: string;
  ACTION_OPEN!: string;
  ACTION_CLOSE!: string;
  SUPPORTED_CONTENT_LANGUAGES!: LanguageIdAndText[];
  SEARCH_DROPDOWN_TYPES!: SearchDropDownItems[];
  selectionDetails;
  SEARCH_DROPDOWN_CATEGORIES!: SearchDropDownItems[];
  KEYBOARD_EVENT_TO_KEY_CODES!: {};
  directiveSubscriptions: Subscription = new Subscription();
  classroomPageIsActive: boolean = false;
  searchButtonIsActive: boolean = false;
  searchQuery: string = '';
  searchQueryChanged: Subject<string> = new Subject<string>();
  translationData: Record<string, number> = {};
  activeMenuName: string = '';
  searchIsInProgress = false;
  storySummaries: StorySummary[];
  subtopicSummaries: SubtopicPageSummary[] = [];

  constructor(
    private alertsService: AlertsService,
    private contextService: ContextService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private loaderService: LoaderService,
    private urlService: UrlService,
    private windowDimensionsService: WindowDimensionsService,
    private translateService: TranslateService,
    private navigationService: NavigationService,
    private languageUtilService: LanguageUtilService,
    private constructTranslationIdsService: ConstructTranslationIdsService,
    private searchService: SearchService,
    private learnerGroupSyllabusBackendApiService:
      LearnerGroupSyllabusBackendApiService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  checkMobileView(): boolean {
    return (this.windowDimensionsService.getWidth() < 500);
  }

  isMobileViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 766;
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  ngOnInit(): void {
    console.log('testing')
    this.SEARCH_DROPDOWN_CATEGORIES = this.searchDropdownCategories();
    this.KEYBOARD_EVENT_TO_KEY_CODES = (
      this.navigationService.KEYBOARD_EVENT_TO_KEY_CODES);
    this.ACTION_OPEN = this.navigationService.ACTION_OPEN;
    this.ACTION_CLOSE = this.navigationService.ACTION_CLOSE;
    this.SUPPORTED_CONTENT_LANGUAGES = (
      this.languageUtilService.getLanguageIdsAndTexts());
    this.SEARCH_DROPDOWN_TYPES = [
      {
        id: 'Skill',
        text: 'Skill'
      },
      {
        id: 'Story',
        text: 'Story'
      }
    ]
    this.selectionDetails = {
      types: {
        description: '',
        itemsName: 'types',
        masterList: this.SEARCH_DROPDOWN_TYPES,
        selection: '',
        default: 'All',
        summary: 'Type'
      },
      categories: {
        description: '',
        itemsName: 'categories',
        masterList: this.SEARCH_DROPDOWN_CATEGORIES,
        selection: '',
        default: 'All',
        summary: 'Category'
      },
      languageCodes: {
        description: '',
        itemsName: 'languages',
        masterList: this.SUPPORTED_CONTENT_LANGUAGES,
        selection: '',
        default: 'All',
        summary: 'Language'
      }
    };
    // this.loaderService.showLoadingScreen('Loading');
    // Initialize the selection descriptions and summaries.
    for (let itemsType in this.selectionDetails) {
      this.updateSelectionDetails(itemsType);
    }

    this.refreshSearchBarLabels();

    this.searchQueryChanged
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(model => {
        this.searchQuery = model;
        this.onSearchQueryChangeExec();
      });

    console.log(this.selectionDetails, "selection details");
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

    // TODO(milit): When the language changes, the translations won't
    // change until the user changes the selection and this function is
    // re-executed.
    if (selectedItemText.length > 0) {
      this.selectionDetails[itemsType].description = (
        this.translateService.instant(selectedItemText));
    } else {
      this.selectionDetails[itemsType].description = (
        this.selectionDetails[itemsType].summary
      );
    }
  }

  isSearchInProgress(): boolean {
    return this.searchService.isSearchInProgress();
  }

  searchDropdownCategories(): SearchDropDownItems[] {
    return constants.SEARCH_DROPDOWN_CLASSROOMS.map((classroomName) => {
      return {
        id: classroomName,
        text: this.constructTranslationIdsService.getClassroomTitleId(
          classroomName)
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
    let syllabusFilter: LearnerGroupSyllabusFilter = {
      keyword: this.searchQuery,
      type: (
        this.selectionDetails.types.selection ||
        this.selectionDetails.types.default
      ),
      category: (
        this.selectionDetails.categories.selection ||
        this.selectionDetails.categories.default
      ),
      languageCode: (
        this.selectionDetails.languageCodes.selection ||
        this.selectionDetails.languageCodes.default
      )
    };
    this.learnerGroupSyllabusBackendApiService.searchNewSyllabusItemsAsync(
      'newId', syllabusFilter
    ).then((syllabusItems) => {
      this.searchIsInProgress = false;
        console.log(syllabusItems, "syllabus items");
        this.storySummaries = syllabusItems.storySummaries;
        this.subtopicSummaries = syllabusItems.subtopicPageSummaries;
    });
  }

  searchToBeExec(e: {target: {value: string}}): void {
    if (!this.searchButtonIsActive) {
      this.searchQueryChanged.next(e.target.value);
    }
  }

  getCompleteThumbnailIconUrl(thumbnailFilename: string): string {
    return this.urlInterpolationService.getStaticImageUrl(
      '/' + thumbnailFilename);
  }

  updateLearnerGroupSyllabus(): void {
    this.updateLearnerGroupStories.emit(this.syllabusStoryIds);
    this.updateLearnerGroupSubtopics.emit(this.syllabusSubtopicPageIds);
  }

  addStoryToSyllabus(storySummary: StorySummary): void {
    this.syllabusStorySummaries.push(storySummary);
    this.syllabusStoryIds.push(storySummary.getId());
    this.updateLearnerGroupSyllabus();
  }

  addSubtopicToSyllabus(subtopicSummary: SubtopicPageSummary): void {
    this.syllabusSubtopicSummaries.push(subtopicSummary);
    this.syllabusSubtopicPageIds.push(subtopicSummary.subtopicPageId);
    this.updateLearnerGroupSyllabus();
  }

  removeStoryFromSyllabus(storySummary: StorySummary): void {
    this.syllabusStorySummaries = this.syllabusStorySummaries.filter(
      (s) => s.getId() !== storySummary.getId());
    this.syllabusStoryIds = this.syllabusStoryIds.filter(
      (id) => id !== storySummary.getId());
    this.updateLearnerGroupSyllabus();
  }

  removeSubtopicFromSyllabus(subtopicSummary: SubtopicPageSummary): void {
    this.syllabusSubtopicSummaries = this.syllabusSubtopicSummaries.filter(
      (s) => s.subtopicPageId !== subtopicSummary.subtopicPageId);
    this.syllabusSubtopicPageIds = this.syllabusSubtopicPageIds.filter(
      (id) => id !== subtopicSummary.subtopicPageId);
    this.updateLearnerGroupSyllabus();
  }

  isStoryPartOfSyllabus(storySummary: StorySummary): boolean {
    return this.syllabusStoryIds.indexOf(storySummary.getId()) !== -1;
  }

  isSubtopicPartOfSyllabus(subtopicSummary: SubtopicPageSummary): boolean {
    return this.syllabusSubtopicPageIds.indexOf(
      subtopicSummary.subtopicPageId) !== -1;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
    this.contextService.removeCustomEntityContext();
  }
}

angular.module('oppia').directive(
  'oppiaLearnerGroupDetails',
  downgradeComponent({component: AddSyllabusItemsComponent}));
