
import { TopicsAndSkillsDashboardPageService } from
  'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.service';

describe('Topic and Skill dashboard page service', () => {
  let tsds: TopicsAndSkillsDashboardPageService = null;

  beforeEach(() => {
    tsds = new TopicsAndSkillsDashboardPageService();
  });

  it('should filter the topics', () => {
    let topic1 = {
      topic_model_created_on: 1581839432987.596,
      uncategorized_skill_count: 0,
      canonical_story_count: 0,
      id: 'wbL5aAyTWfOH1',
      is_published: true,
      total_skill_count: 10,
      can_edit_topic: true,
      topic_model_last_updated: 1581839492500.852,
      additional_story_count: 0,
      name: 'Alpha',
      version: 1,
      description: 'Alpha description',
      subtopic_count: 0,
      language_code: 'en',
      $$hashKey: 'object:63',
    };
    const topic2 = {
      topic_model_created_on: 1581839432987.596,
      uncategorized_skill_count: 0,
      canonical_story_count: 0,
      id: 'wbL5aAyTWfOH1',
      is_published: true,
      total_skill_count: 10,
      can_edit_topic: true,
      topic_model_last_updated: 1581839492500.852,
      additional_story_count: 0,
      name: 'Beta',
      version: 1,
      description: 'Beta description',
      subtopic_count: 0,
      language_code: 'en',
      $$hashKey: 'object:63',
    };
    const topic3 = {
      topic_model_created_on: 1581839432987.596,
      uncategorized_skill_count: 0,
      canonical_story_count: 0,
      id: 'wbL5aAyTWfOH1',
      is_published: true,
      total_skill_count: 10,
      can_edit_topic: true,
      topic_model_last_updated: 1581839492500.852,
      additional_story_count: 0,
      name: 'Gamma',
      version: 1,
      description: 'Gamma description',
      subtopic_count: 0,
      language_code: 'en',
      $$hashKey: 'object:63',
    };
    let topicsArray = [topic1, topic2, topic3];
    let filterOptions = {
      sort: '',
      keywords: '',
      category: '',
      status: '',
    };
    let filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual(topicsArray);
    filterOptions.keywords = 'alp';
    filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual([topic1]);
  });
});
