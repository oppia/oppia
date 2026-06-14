// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Redesigned story section for the topic viewer page.
 */

import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import {AppConstants} from 'app.constants';
import {StoryNode} from 'domain/story/story-node.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PracticeSessionPageConstants} from 'pages/practice-session-page/practice-session-page.constants';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {UrlService} from 'services/contextual/url.service';

import './topic-story-section.component.css';

const PRIMARY_AVATAR_IMAGE_PATH = '/avatar/oppia_avatar_large_100px.svg';
const FALLBACK_AVATAR_IMAGE_PATH = '/general/collection_mascot.svg';
const FALLBACK_LESSON_THUMBNAIL_PATH = '/splash/student_desk1x.webp';

interface LessonCardData {
  lessonNumber: number;
  lessonTitle: string;
  lessonDescription: string;
  thumbnailUrl: string;
  startUrl: string;
}

interface PracticeCardData {
  practiceTitle: string;
  practiceDescription: string;
  relatedLessonNumber: number | null;
  thumbnailUrl: string;
  studyUrl: string;
  practiceUrl: string;
}

@Component({
  selector: 'topic-story-section',
  templateUrl: './topic-story-section.component.html',
  styleUrls: ['./topic-story-section.component.css'],
})
export class TopicStorySectionComponent implements OnInit, OnChanges {
  @Input() storySummary!: StorySummary;
  @Input() storyTitle!: string;
  @Input() storyDescription!: string;
  @Input() classroomUrlFragment: string = '';
  @Input() topicUrlFragment: string = '';
  @Input() practiceSubtopicIds: number[] = [];

  @Input() practiceCount: number = 0;
  @Input() lessonCount: number = 0;

  oppiaAvatarImageUrl: string = '';
  studyGuideUrl: string = '#';
  lessonCards: LessonCardData[] = [];
  practiceCard!: PracticeCardData;
  isPracticeCardVisible: boolean = false;

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService
  ) {}

  ngOnInit(): void {
    this.populateFromInputs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.storySummary ||
      changes.storyTitle ||
      changes.storyDescription ||
      changes.classroomUrlFragment ||
      changes.topicUrlFragment ||
      changes.lessonCount ||
      changes.practiceCount
    ) {
      this.populateFromInputs();
    }
  }

  onAvatarImageError(): void {
    if (this.oppiaAvatarImageUrl !== this.getFallbackAvatarImageUrl()) {
      this.oppiaAvatarImageUrl = this.getFallbackAvatarImageUrl();
    }
  }

  getLessonCountText(): string {
    return this.lessonCount === 1
      ? this.lessonCount + ' lesson'
      : this.lessonCount + ' lessons';
  }

  getPracticeCountText(): string {
    return this.practiceCount === 1
      ? this.practiceCount + ' practice'
      : this.practiceCount + ' practices';
  }

  getStoryMetaText(): string {
    return this.getLessonCountText() + ', ' + this.getPracticeCountText();
  }

  getStoryMetaAriaLabel(): string {
    return (
      this.getLessonCountText() +
      ' and ' +
      this.getPracticeCountText() +
      ' available'
    );
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  private populateFromInputs(): void {
    if (!this.classroomUrlFragment) {
      this.classroomUrlFragment =
        this.urlService.getClassroomUrlFragmentFromLearnerUrl();
    }
    if (!this.topicUrlFragment) {
      this.topicUrlFragment =
        this.urlService.getTopicUrlFragmentFromLearnerUrl();
    }

    this.oppiaAvatarImageUrl = this.getPrimaryAvatarImageUrl();
    this.studyGuideUrl = this.getStudyGuideUrl();

    this.storyTitle = this.storySummary.getTitle();
    this.storyDescription = this.storySummary.getDescription() || '';
    this.lessonCount = this.storySummary.getNodeTitles().length;
    this.lessonCards = this.storySummary
      .getAllNodes()
      .map((node: StoryNode, index: number) => {
        return {
          lessonNumber: index + 1,
          lessonTitle: 'Lesson ' + (index + 1) + ': ' + node.getTitle(),
          lessonDescription: node.getDescription(),
          thumbnailUrl: this.getLessonThumbnailUrl(node),
          startUrl: this.getLessonStartUrl(node),
        };
      });

    this.isPracticeCardVisible =
      this.lessonCards.length === 0 && this.practiceCount >= 1;
    this.practiceCard = this.getPracticeCardData();
  }

  private getPracticeCardData(): PracticeCardData {
    return {
      practiceTitle: 'Practice 1: ' + this.storyTitle,
      practiceDescription: '',
      relatedLessonNumber:
        this.lessonCards.length > 0 ? this.lessonCards[0].lessonNumber : null,
      thumbnailUrl: this.getFallbackLessonThumbnailUrl(),
      studyUrl: this.studyGuideUrl,
      practiceUrl: this.getPracticeSessionUrl(),
    };
  }

  private getPracticeSessionUrl(): string {
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return '#';
    }

    const practiceSubtopicId = this.practiceSubtopicIds[0];
    if (practiceSubtopicId === undefined) {
      return '#';
    }

    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.PRACTICE_SESSIONS_URL,
      {
        classroom_url_fragment: this.classroomUrlFragment,
        topic_url_fragment: this.topicUrlFragment,
        stringified_subtopic_ids: JSON.stringify([practiceSubtopicId]),
      }
    );
  }

  private getLessonThumbnailUrl(node: StoryNode): string {
    const thumbnailFilename = node.getThumbnailFilename();
    const storyId = this.storySummary.getId();
    if (thumbnailFilename) {
      if (!storyId) {
        return this.getFallbackLessonThumbnailUrl();
      }
      return this.assetsBackendApiService.getThumbnailUrlForPreview(
        AppConstants.ENTITY_TYPE.STORY,
        storyId,
        thumbnailFilename
      );
    }
    return this.getFallbackLessonThumbnailUrl();
  }

  private getLessonStartUrl(node: StoryNode): string {
    const explorationId = node.getExplorationId();
    if (
      !explorationId ||
      !this.classroomUrlFragment ||
      !this.topicUrlFragment
    ) {
      return '#';
    }

    let lessonUrl = this.urlInterpolationService.interpolateUrl(
      '/explore/<exp_id>',
      {exp_id: explorationId}
    );
    lessonUrl = this.urlService.addField(
      lessonUrl,
      'topic_url_fragment',
      this.topicUrlFragment
    );
    lessonUrl = this.urlService.addField(
      lessonUrl,
      'classroom_url_fragment',
      this.classroomUrlFragment
    );
    lessonUrl = this.urlService.addField(
      lessonUrl,
      'story_url_fragment',
      this.storySummary.getUrlFragment()
    );
    lessonUrl = this.urlService.addField(lessonUrl, 'node_id', node.getId());
    return lessonUrl;
  }

  private getStudyGuideUrl(): string {
    return this.urlService.getLearnerTopicStudyGuideUrl();
  }

  private getPrimaryAvatarImageUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      PRIMARY_AVATAR_IMAGE_PATH
    );
  }

  private getFallbackAvatarImageUrl(): string {
    return this.urlInterpolationService.getStaticCopyrightedImageUrl(
      FALLBACK_AVATAR_IMAGE_PATH
    );
  }

  private getFallbackLessonThumbnailUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      FALLBACK_LESSON_THUMBNAIL_PATH
    );
  }
}
