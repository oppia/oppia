import {downgradeInjectable} from '@angular/upgrade/static';
import {Injectable} from '@angular/core';

import { TopicsAndSkillsDashboardPageConstants } from
  'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants';
@Injectable({
  providedIn: 'root'
})
export class TopicsAndSkillsDashboardPageService {
  getFilteredTopics(topicsArray, properties) {
    const {sort, keywords, category, status} = properties;
    let ESortOptions = TopicsAndSkillsDashboardPageConstants.ESortOptions;
    let EPublishedOptions = (
      TopicsAndSkillsDashboardPageConstants.EPublishedOptions);
    let filteredTopics = topicsArray;
    if (keywords) {
      filteredTopics = topicsArray.filter((topic) => {
        return (
          topic.name.toLowerCase().includes(keywords.toLowerCase()) ||
          topic.description.toLowerCase().includes(keywords.toLowerCase()));
      });
    }

    if (category) {
      filteredTopics = filteredTopics.filter((topic) => {
        return TopicsAndSkillsDashboardPageConstants.TOPIC_CATEGORIES.includes(topic.category);
      });
    }

    if (status) {
      filteredTopics = filteredTopics.filter((topic) => {
        if (status === EPublishedOptions.Published && topic.is_published) {
          return true;
        } else if (
          status === EPublishedOptions.NotPublished && !topic.is_published) {
          return true;
        }
        return false;
      });
    }

    if (sort) {
      switch (sort) {
        case ESortOptions.IncreasingUpdatedOn:
          filteredTopics.sort((a, b) => (
            b.topic_model_created_on - a.topic_model_created_on));
          break;
        case ESortOptions.DecreasingUpdatedOn:
          filteredTopics.sort((a, b) =>
            -(b.topic_model_created_on - a.topic_model_created_on));
          break;
        case ESortOptions.IncreasingCreatedOn:
          filteredTopics.sort((a, b) =>
            (b.topic_model_last_updated - a.topic_model_last_updated));
          break;
        case ESortOptions.DecreasingCreatedOn:
          filteredTopics.sort((a, b) =>
            -(b.topic_model_last_updated - a.topic_model_last_updated));
      }
    }
    return filteredTopics;
  }
}

angular.module('oppia').factory(
  'TopicsAndSkillsDashboardPageService',
  downgradeInjectable(TopicsAndSkillsDashboardPageService));
