import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'lesson-card',
  templateUrl: './lesson-card.component.html'
})

export class LessonCardComponent implements OnInit{
  @Input() desc!: string;
  @Input() imgColor!: string;
  @Input() imgUrl!: string;
  @Input() lessonUrl!: string;
  @Input() progress!: number;
  @Input() title!: string;
  @Input() topic: string;

  /**
   * if lessonType === classes
   * Move functions from
   * - exploration-summary-tile.component
   *  - getThumbnailIconUrl - imgUrl 
   *  - getExplorationLink (?)
   *  - Translation Key
   */
  ngOnInit(): void {
    /**
     * Temporary for consolidating cards 
     * 
     * if (lessonType === 'class') {
     *  let completedStories = story.getCompletedNodeTitles().length 
     * 
     *  this.desc = story.getTitle();
     *  this.imgColor = story.getThumbnailBgColor();
     *  this.imgUrl = assetsBackendApiService
     *  this.lessonUrl = story.getAllNodes(completedStories) - urlInterpolationService.addField
     *  this.title = `Chapter ${completedStories + 1}: ${story.getNodeTitles()[completedStories]}`
     *  this.topic = input
     *  this.progress = Math.floor(completedStories / story.getNodeTitles().length * 100);
     * } else {
     *  this.desc = story.objective
     *  this.imgColor = story.thumbnailBgColor
     *  this.imageUrl = getImageUrl(story.thumbnailIconUrl)
     *  this.lessonUrl = '/explore/' + story.id (temp)
     *  this.progress = if from incompleteList === 0: 100
     *  this.title = story.title
     *  this.topic = 'Community Lesson'
     * }
     * 
     */

  }

  getProgress(arg: number) : string {
    return 'linear-gradient(' + (50 >= arg? (180 + (arg / 100 * 180)) : 270) + 'deg, #00645c ' + (50 >= arg ? arg : 50) + '%, transparent ' + (50 >= arg ? arg : 50) +'%),' +
    'linear-gradient(0deg, #00645c ' + (arg > 50 ? arg - 50 : 0) + '%, lightgray ' + (arg> 50 ? arg - 50 : 0) + '%)'
  }
}

angular.module('oppia').directive(
  'lessonCardComponent', downgradeComponent(
    {component: LessonCardComponent}));