import {Component, Input, OnInit} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';
import {AppConstants} from 'app.constants';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {StorySummary} from 'domain/story/story-summary.model';

@Component({
  selector: 'lesson-card',
  templateUrl: './lesson-card.component.html',
})
export class LessonCardComponent implements OnInit {
  @Input() story: StorySummary | LearnerExplorationSummary | CollectionSummary;
  @Input() topic: string;

  desc!: string;
  imgColor!: string;
  imgUrl!: string;
  lessonUrl!: string;
  progress!: number;
  title!: string;
  lessonTopic!: string;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private assetsBackendApiService: AssetsBackendApiService
  ) {}

  ngOnInit(): void {
    if (this.story instanceof StorySummary) {
      let completedStories = this.story.getCompletedNodeTitles().length;

      this.desc = this.story.getTitle();
      this.imgColor = this.story.getThumbnailBgColor();

      if (this.story.getThumbnailFilename()) {
        this.imgUrl = this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.STORY,
          this.story.getId(),
          this.story.getThumbnailFilename()
        );
      }

      //last completed story index works because if 1 is completed, 1 index is 2nd item
      let currentStory = this.story.getAllNodes()[completedStories];
      let classFragment = this.story.getClassroomUrlFragment();
      let topicFragment = this.story.getTopicUrlFragment();

      //put as separate function
      this.lessonUrl =
        classFragment === undefined || topicFragment === undefined
          ? '#'
          : `/explore/${currentStory.getExplorationId()}?` +
            Object.entries({
              topic_url_fragment: topicFragment,
              classroom_url_fragment: classFragment,
              story_url_fragment: this.story.getUrlFragment(),
              node_id: currentStory.getId(),
            })
              .map(([key, value]) => `${key}=${value}`)
              .join('&');

      this.title = `Chapter ${completedStories + 1}: ${this.story.getNodeTitles()[completedStories]}`;
      this.progress = Math.floor(
        (completedStories / this.story.getNodeTitles().length) * 100
      );
      this.lessonTopic = this.topic;
    } else {
      /* Implementation for explorations & collections */
      this.desc = this.story.objective;
      this.imgColor = this.story.thumbnailBgColor;
      this.imgUrl = this.urlInterpolationService.getStaticImageUrl(
        this.story.thumbnailIconUrl
      );
      this.progress = 0;
      this.title = this.story.title;

      if (this.story instanceof CollectionSummary) {
        this.lessonUrl = '';
        this.lessonTopic = 'Collections';
      } else {
        this.lessonUrl = `/explore/${this.story.id}`;
        this.lessonTopic = 'Community Lessons';
      }
    }
  }

  getProgress(arg: number): string {
    let leftCircle = 50 >= arg ? arg : 50;
    let rightCircle = arg > 50 ? arg - 50 : 0;

    return `linear-gradient(${50 >= arg ? 180 + (arg / 100) * 180 : 270} deg, #00645c ${leftCircle}%, transparent ${leftCircle}%), linear-gradient(0deg, #00645c ${rightCircle}%, lightgray ${rightCircle}%)`;
  }
}

angular
  .module('oppia')
  .directive(
    'lessonCardComponent',
    downgradeComponent({component: LessonCardComponent})
  );
