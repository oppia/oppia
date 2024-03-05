import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { StorySummary } from 'domain/story/story-summary.model';
import { UrlService } from 'services/contextual/url.service';

@Component({
  selector: 'lesson-card',
  templateUrl: './lesson-card.component.html'
})


export class LessonCardComponent implements OnInit{
  @Input() story: StorySummary | LearnerExplorationSummary;
  @Input() topic: string;

  desc!: string;
  imgColor!: string;
  imgUrl!: string;
  lessonUrl!: string;
  progress!: number;
  title!: string;
  /**
   * if lessonType === classes
   * Move functions from
   * - exploration-summary-tile.component
   *  - getThumbnailIconUrl - imgUrl 
   *  - getExplorationLink (?)
   *  - Translation Key
   */
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private assetsBackendApiService: AssetsBackendApiService,
    private urlService: UrlService,
  ) {}

  ngOnInit(): void {
    if (this.story instanceof StorySummary) {
      let completedStories = this.story.getCompletedNodeTitles().length;

      this.desc = this.story.getTitle();
      this.imgColor = this.story.getThumbnailBgColor();
      //check if undefined needs to be tested 
      if (this.story.getThumbnailFilename()) {
        this.imgUrl = this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.STORY, this.story.getId(), this.story.getThumbnailFilename());
      }

      //last completed story index works because if 1 is completed, 1 index is 2nd item
      let currentStory = this.story.getAllNodes()[completedStories];
      let classFragment = this.story.getClassroomUrlFragment();
      let topicFragment = this.story.getTopicUrlFragment();

      //check if undefined needs to be tested 
      this.lessonUrl = ((classFragment === undefined || topicFragment === undefined ) ?
        '#'
      :
        `/explore/${currentStory.getExplorationId()}?` +  Object.entries({
          topic_url_fragment: topicFragment,
          classroom_url_fragment: classFragment,
          story_url_fragment: this.story.getUrlFragment(),
          node_id: currentStory.getId()
        }).map(([key, value]) => this.urlService.addField('', key, value)).join('')
      );

      //Must be a better way to do this (remove getNodeTitles())
      this.title =`Chapter ${completedStories + 1}: ${this.story.getNodeTitles()[completedStories]}`;
      this.progress = Math.floor(completedStories / this.story.getNodeTitles().length * 100);

    } else {
      this.desc = this.story.objective;
      this.imgColor = this.story.thumbnailBgColor;
      this.imgUrl = this.urlInterpolationService.getStaticImageUrl(this.story.thumbnailIconUrl);
      //temp
      this.lessonUrl = `/explore/${this.story.id}`;
      //temp
      this.progress = 0;
      this.title = this.story.title;
    }
  }

  //go back 1 - add test case 
  getProgress(arg: number) : string {
    return 'linear-gradient(' + (50 >= arg? (180 + (arg / 100 * 180)) : 270) + 'deg, #00645c ' + (50 >= arg ? arg : 50) + '%, transparent ' + (50 >= arg ? arg : 50) +'%),' +
    'linear-gradient(0deg, #00645c ' + (arg > 50 ? arg - 50 : 0) + '%, lightgray ' + (arg> 50 ? arg - 50 : 0) + '%)'
  }

}

angular.module('oppia').directive(
  'lessonCardComponent', downgradeComponent(
    {component: LessonCardComponent}));