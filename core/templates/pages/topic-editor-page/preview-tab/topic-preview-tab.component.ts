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
 * @fileoverview Component for the topic preview tab.
 */

import {Component} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {StorySummary} from 'domain/story/story-summary.model';
import {Subscription} from 'rxjs';
import {PageTitleService} from 'services/page-title.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {Subtopic} from 'domain/topic/subtopic.model';
import {Topic} from 'domain/topic/topic-object.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import './topic-preview-tab.component.css';
import {TopicViewerStorySectionData} from 'pages/topic-viewer-page/topic-viewer-content/topic-viewer-content.component';

@Component({
  selector: 'oppia-topic-preview-tab',
  templateUrl: './topic-preview-tab.component.html',
  styleUrls: ['./topic-preview-tab.component.css'],
})
export class TopicPreviewTabComponent {
  private _TAB_STORY: string = 'story';
  private _TAB_SUBTOPIC: string = 'subtopic';
  private _TAB_PRACTICE: string = 'practice';
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  topic!: Topic;
  topicName!: string;
  directiveSubscriptions = new Subscription();
  pageTitleFragment: string = '';
  classroomUrlFragment: string = '';
  classroomName: string = '';
  topicUrlFragment!: string;
  subtopics!: Subtopic[];
  canonicalStorySummaries!: StorySummary[];
  canonicalStorySectionData: readonly TopicViewerStorySectionData[] = [];
  activeTab: string = this._TAB_STORY;
  chapterCount: number = 0;
  practiceTabIsDisplayed: boolean = false;

  constructor(
    private topicEditorStateService: TopicEditorStateService,
    private urlInterpolationService: UrlInterpolationService,
    private pageTitleService: PageTitleService,
    private translateService: TranslateService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  ngOnInit(): void {
    this.topic = this.topicEditorStateService.getTopic();
    this.topicUrlFragment = this.topicEditorStateService
      .getTopic()
      .getUrlFragment();
    this.classroomName = this.topicEditorStateService.getClassroomName() ?? '';
    this.classroomUrlFragment =
      this.topicEditorStateService.getClassroomUrlFragment() ?? '';
    this.topicName = this.topic.getName();
    this.topicUrlFragment = this.topic.getUrlFragment();
    this.subtopics = this.topic.getSubtopics();
    this.canonicalStorySummaries =
      this.topicEditorStateService.getCanonicalStorySummaries();
    for (let idx in this.canonicalStorySummaries) {
      this.chapterCount +=
        this.canonicalStorySummaries[idx].getNodeTitles().length;
    }
    this.canonicalStorySectionData = this.getCanonicalStorySectionData();
    this.setPageTitle();
    this.subscribeToOnLangChange();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  changePreviewTab(tabName: string): void {
    switch (tabName) {
      case this._TAB_STORY:
        this.activeTab = this._TAB_STORY;
        break;
      case this._TAB_SUBTOPIC:
        this.activeTab = this._TAB_SUBTOPIC;
        break;
      case this._TAB_PRACTICE:
        this.activeTab = this._TAB_PRACTICE;
        break;
    }
  }

  isPracticeTabEnabled(): boolean {
    return this.topic.getPracticeTabIsDisplayed();
  }

  isRedesignedTopicViewerPageFeatureEnabled(): boolean {
    return this.platformFeatureService.status.RedesignedTopicViewerPage
      .isEnabled;
  }

  private getCanonicalStorySectionData(): readonly TopicViewerStorySectionData[] {
    const practiceSubtopicIds = this.topic
      .getSubtopics()
      .filter(subtopic => {
        return subtopic.getSkillSummaries().length > 0;
      })
      .map(subtopic => subtopic.getId());

    const practiceCount = practiceSubtopicIds.length;

    return this.canonicalStorySummaries.map(storySummary => {
      return {
        storyId: storySummary.getId(),
        storyTitle: storySummary.getTitle(),
        storyDescription: storySummary.getDescription() || '',
        storySummary,
        practiceSubtopicIds,
        classroomUrlFragment: this.classroomUrlFragment,
        topicUrlFragment: this.topicUrlFragment,
        lessonCount: storySummary.getNodeTitles().length,
        practiceCount,
      };
    });
  }

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_TOPIC_VIEWER_PAGE_TITLE',
      {
        topicName: this.topicName,
        pageTitleFragment: this.pageTitleFragment,
      }
    );
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }
}
