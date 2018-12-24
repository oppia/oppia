# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""System for computing recommendations for explorations and users."""

import StringIO
import csv
import datetime
import json

from core.domain import rights_manager
from core.platform import models
import feconf

(exp_models, recommendations_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.recommendations])

# pylint: disable=line-too-long
DEFAULT_TOPIC_SIMILARITIES_STRING = ("""Architecture,Art,Biology,Business,Chemistry,Computing,Economics,Education,Engineering,Environment,Geography,Government,Hobbies,Languages,Law,Life Skills,Mathematics,Medicine,Music,Philosophy,Physics,Programming,Psychology,Puzzles,Reading,Religion,Sport,Statistics,Welcome
1.0,0.9,0.2,0.4,0.1,0.2,0.3,0.3,0.6,0.6,0.4,0.2,0.5,0.5,0.5,0.3,0.5,0.3,0.3,0.5,0.4,0.1,0.6,0.1,0.1,0.1,0.1,0.1,0.3
0.9,1.0,0.1,0.6,0.1,0.1,0.6,0.6,0.2,0.3,0.3,0.2,0.5,0.7,0.6,0.2,0.3,0.2,0.9,0.7,0.3,0.1,0.6,0.1,0.1,0.1,0.1,0.1,0.3
0.2,0.1,1.0,0.2,0.8,0.3,0.2,0.3,0.3,0.7,0.4,0.2,0.2,0.1,0.1,0.9,0.4,0.8,0.1,0.1,0.4,0.1,0.6,0.1,0.1,0.1,0.1,0.6,0.3
0.4,0.6,0.2,1.0,0.1,0.5,0.9,0.6,0.4,0.6,0.2,0.7,0.2,0.5,0.7,0.1,0.3,0.1,0.1,0.6,0.1,0.2,0.3,0.1,0.1,0.1,0.1,0.5,0.3
0.1,0.1,0.8,0.1,1.0,0.2,0.2,0.3,0.2,0.6,0.6,0.1,0.2,0.2,0.2,0.7,0.3,0.7,0.1,0.1,0.2,0.1,0.3,0.1,0.1,0.1,0.1,0.3,0.3
0.2,0.1,0.3,0.5,0.2,1.0,0.6,0.3,0.6,0.1,0.1,0.1,0.2,0.2,0.1,0.3,0.9,0.2,0.2,0.3,0.4,0.95,0.3,0.5,0.1,0.1,0.1,0.6,0.3
0.3,0.6,0.2,0.9,0.2,0.6,1.0,0.3,0.3,0.5,0.4,0.7,0.2,0.4,0.8,0.2,0.6,0.2,0.1,0.3,0.1,0.3,0.6,0.3,0.2,0.1,0.1,0.7,0.3
0.3,0.6,0.3,0.6,0.3,0.3,0.3,1.0,0.3,0.5,0.3,0.5,0.2,0.2,0.6,0.1,0.2,0.1,0.1,0.5,0.1,0.1,0.6,0.1,0.3,0.2,0.2,0.2,0.3
0.6,0.2,0.3,0.4,0.2,0.6,0.3,0.3,1.0,0.4,0.2,0.2,0.2,0.2,0.3,0.1,0.7,0.1,0.1,0.3,0.6,0.6,0.2,0.3,0.1,0.1,0.1,0.5,0.3
0.6,0.3,0.7,0.6,0.6,0.1,0.5,0.5,0.4,1.0,0.8,0.6,0.2,0.2,0.3,0.8,0.2,0.3,0.1,0.2,0.1,0.1,0.3,0.1,0.1,0.1,0.1,0.3,0.3
0.4,0.3,0.4,0.2,0.6,0.1,0.4,0.3,0.2,0.8,1.0,0.2,0.2,0.4,0.3,0.6,0.3,0.3,0.1,0.1,0.1,0.1,0.3,0.1,0.1,0.1,0.1,0.2,0.3
0.2,0.2,0.2,0.7,0.1,0.1,0.7,0.5,0.2,0.6,0.2,1.0,0.2,0.3,0.8,0.1,0.1,0.1,0.1,0.4,0.1,0.1,0.4,0.1,0.5,0.5,0.2,0.4,0.3
0.5,0.5,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,1.0,0.5,0.2,0.2,0.3,0.2,0.4,0.2,0.3,0.5,0.2,0.6,0.5,0.3,0.6,0.2,0.3
0.5,0.7,0.1,0.5,0.2,0.2,0.4,0.2,0.2,0.2,0.4,0.3,0.5,1.0,0.3,0.1,0.1,0.1,0.3,0.4,0.1,0.1,0.3,0.1,0.8,0.4,0.1,0.1,0.3
0.5,0.6,0.1,0.7,0.2,0.1,0.8,0.6,0.3,0.3,0.3,0.8,0.2,0.3,1.0,0.1,0.1,0.1,0.1,0.6,0.1,0.1,0.6,0.1,0.4,0.6,0.1,0.2,0.3
0.3,0.2,0.9,0.1,0.7,0.3,0.2,0.1,0.1,0.8,0.6,0.1,0.2,0.1,0.1,1.0,0.4,0.8,0.1,0.2,0.2,0.2,0.3,0.1,0.2,0.1,0.3,0.4,0.3
0.5,0.3,0.4,0.3,0.3,0.9,0.6,0.2,0.7,0.2,0.3,0.1,0.3,0.1,0.1,0.4,1.0,0.2,0.3,0.4,0.7,0.8,0.2,0.6,0.1,0.1,0.1,0.8,0.3
0.3,0.2,0.8,0.1,0.7,0.2,0.2,0.1,0.1,0.3,0.3,0.1,0.2,0.1,0.1,0.8,0.2,1.0,0.2,0.3,0.1,0.2,0.3,0.1,0.1,0.1,0.1,0.1,0.3
0.3,0.9,0.1,0.1,0.1,0.2,0.1,0.1,0.1,0.1,0.1,0.1,0.4,0.3,0.1,0.1,0.3,0.2,1.0,0.6,0.3,0.2,0.4,0.1,0.3,0.1,0.1,0.1,0.3
0.5,0.7,0.1,0.6,0.1,0.3,0.3,0.5,0.3,0.2,0.1,0.4,0.2,0.4,0.6,0.2,0.4,0.3,0.6,1.0,0.3,0.6,0.4,0.5,0.2,0.1,0.1,0.3,0.3
0.4,0.3,0.4,0.1,0.2,0.4,0.1,0.1,0.6,0.1,0.1,0.1,0.3,0.1,0.1,0.2,0.7,0.1,0.3,0.3,1.0,0.6,0.1,0.5,0.2,0.1,0.3,0.4,0.3
0.1,0.1,0.1,0.2,0.1,0.95,0.3,0.1,0.6,0.1,0.1,0.1,0.5,0.1,0.1,0.2,0.8,0.2,0.2,0.6,0.6,1.0,0.3,0.6,0.1,0.1,0.1,0.6,0.3
0.6,0.6,0.6,0.3,0.3,0.3,0.6,0.6,0.2,0.3,0.3,0.4,0.2,0.3,0.6,0.3,0.2,0.3,0.4,0.4,0.1,0.3,1.0,0.4,0.3,0.3,0.2,0.4,0.3
0.1,0.1,0.1,0.1,0.1,0.5,0.3,0.1,0.3,0.1,0.1,0.1,0.6,0.1,0.1,0.1,0.6,0.1,0.1,0.5,0.5,0.6,0.4,1.0,0.1,0.1,0.1,0.5,0.3
0.1,0.1,0.1,0.1,0.1,0.1,0.2,0.3,0.1,0.1,0.1,0.5,0.5,0.8,0.4,0.2,0.1,0.1,0.3,0.2,0.2,0.1,0.3,0.1,1.0,0.4,0.1,0.1,0.3
0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.2,0.1,0.1,0.1,0.5,0.3,0.4,0.6,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.3,0.1,0.4,1.0,0.2,0.1,0.3
0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.2,0.1,0.1,0.1,0.2,0.6,0.1,0.1,0.3,0.1,0.1,0.1,0.1,0.3,0.1,0.2,0.1,0.1,0.2,1.0,0.3,0.3
0.1,0.1,0.6,0.5,0.3,0.6,0.7,0.2,0.5,0.3,0.2,0.4,0.2,0.1,0.2,0.4,0.8,0.1,0.1,0.3,0.4,0.6,0.4,0.5,0.1,0.1,0.3,1.0,0.3
0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,1.0""")
# pylint: enable=line-too-long

RECOMMENDATION_CATEGORIES = [
    'Architecture',
    'Art',
    'Biology',
    'Business',
    'Chemistry',
    'Computing',
    'Economics',
    'Education',
    'Engineering',
    'Environment',
    'Geography',
    'Government',
    'Hobbies',
    'Languages',
    'Law',
    'Life Skills',
    'Mathematics',
    'Medicine',
    'Music',
    'Philosophy',
    'Physics',
    'Programming',
    'Psychology',
    'Puzzles',
    'Reading',
    'Religion',
    'Sport',
    'Statistics',
    'Welcome'
]


def get_topic_similarities_dict():
    """Returns a 2d dict of topic similarities. Creates the default similarity
    dict if it does not exist yet.
    """

    topic_similarities_entity = (
        recommendations_models.TopicSimilaritiesModel.get(
            recommendations_models.TOPIC_SIMILARITIES_ID, strict=False))
    if topic_similarities_entity is None:
        topic_similarities_entity = _create_default_topic_similarities()

    return json.loads(topic_similarities_entity.content)


def save_topic_similarities(topic_similarities):
    """Stores topic similarities in the datastore. Returns the newly created or
    changed entity.
    """

    topic_similarities_entity = (
        recommendations_models.TopicSimilaritiesModel.get(
            recommendations_models.TOPIC_SIMILARITIES_ID, strict=False))
    if topic_similarities_entity is None:
        topic_similarities_entity = (
            recommendations_models.TopicSimilaritiesModel(
                id=recommendations_models.TOPIC_SIMILARITIES_ID,
                content=json.dumps(topic_similarities)))
    else:
        topic_similarities_entity.content = json.dumps(topic_similarities)
    topic_similarities_entity.put()

    return topic_similarities_entity


def _create_default_topic_similarities():
    """Creates the default topic similarities, and stores them in the datastore.
    The keys are names of the default categories, and values are
    DEFAULT_TOPIC_SIMILARITY if the keys are different and
    SAME_TOPIC_SIMILARITY if the keys are the same.

    Returns the newly created TopicSimilaritiesModel.
    """

    topic_similarities_dict = {
        topic: {} for topic in RECOMMENDATION_CATEGORIES
    }
    data = DEFAULT_TOPIC_SIMILARITIES_STRING.splitlines()
    data = list(csv.reader(data))
    topics_list = data[0]
    topic_similarities_values = data[1:]
    for row_ind, topic_1 in enumerate(topics_list):
        for col_ind, topic_2 in enumerate(topics_list):
            topic_similarities_dict[topic_1][topic_2] = float(
                topic_similarities_values[row_ind][col_ind])

    return save_topic_similarities(topic_similarities_dict)


def get_topic_similarity(topic_1, topic_2):
    """Gets the similarity between two topics, as a float between 0 and 1.

    It checks whether the two topics are in the list of default topics. If
    not, it returns the default similarity if the topics are different or 1 if
    the topics are the same.
    """

    if (topic_1 in RECOMMENDATION_CATEGORIES and
            topic_2 in RECOMMENDATION_CATEGORIES):
        topic_similarities = get_topic_similarities_dict()
        return topic_similarities[topic_1][topic_2]
    else:
        if topic_1 == topic_2:
            return feconf.SAME_TOPIC_SIMILARITY
        else:
            return feconf.DEFAULT_TOPIC_SIMILARITY


def get_topic_similarities_as_csv():
    """Downloads all similarities corresponding to the current topics as a
    string which contains the contents of a csv file.

    The first line is a list of the current topics. The next lines are an
    adjacency matrix of similarities.
    """
    output = StringIO.StringIO()
    writer = csv.writer(output)
    writer.writerow(RECOMMENDATION_CATEGORIES)

    topic_similarities = get_topic_similarities_dict()
    for topic in RECOMMENDATION_CATEGORIES:
        topic_similarities_row = [value for _, value in sorted(
            topic_similarities[topic].iteritems())]
        writer.writerow(topic_similarities_row)

    return output.getvalue()


def _validate_topic_similarities(data):
    """Validates topic similarities given by data, which should be a string
    of comma-separated values.

    The first line of data should be a list of topic names. The next lines
    should be a symmetric adjacency matrix of similarities, which are floats
    between 0.0 and 1.0.

    This function checks whether topics belong in the current list of
    known topics, and if the adjacency matrix is valid.
    """
    data = data.splitlines()
    data = list(csv.reader(data))
    topics_list = data[0]
    topics_length = len(topics_list)
    topic_similarities_values = data[1:]

    if len(topic_similarities_values) != topics_length:
        raise Exception(
            'Length of topic similarities columns does not match topic list.')

    for topic in topics_list:
        if topic not in RECOMMENDATION_CATEGORIES:
            raise Exception('Topic %s not in list of known topics.' % topic)

    for index, topic in enumerate(topics_list):
        if len(topic_similarities_values[index]) != topics_length:
            raise Exception(
                'Length of topic similarities rows does not match topic list.')

    for row_ind in range(topics_length):
        for col_ind in range(topics_length):
            similarity = topic_similarities_values[row_ind][col_ind]
            try:
                similarity = float(similarity)
            except:
                raise ValueError('Expected similarity to be a float, received '
                                 '%s' % similarity)

            if similarity < 0.0 or similarity > 1.0:
                raise ValueError('Expected similarity to be between 0.0 and '
                                 '1.0, received %s' % similarity)

    for row_ind in range(topics_length):
        for col_ind in range(topics_length):
            if (topic_similarities_values[row_ind][col_ind] !=
                    topic_similarities_values[col_ind][row_ind]):
                raise Exception('Expected topic similarities to be symmetric.')


def update_topic_similarities(data):
    """Updates all topic similarity pairs given by data, which should be a
    string of comma-separated values.

    The first line of data should be a list of topic names. The next lines
    should be a symmetric adjacency matrix of similarities, which are floats
    between 0.0 and 1.0.

    The topic names should belong to the current list of topics, but they need
    not include every current topic. If a topic name is not in the data, its
    similarities remain as the previous value or the default.
    """

    _validate_topic_similarities(data)

    data = data.splitlines()
    data = list(csv.reader(data))
    topics_list = data[0]
    topic_similarities_values = data[1:]

    topic_similarities_dict = get_topic_similarities_dict()
    for row_ind, topic_1 in enumerate(topics_list):
        for col_ind, topic_2 in enumerate(topics_list):
            topic_similarities_dict[topic_1][topic_2] = float(
                topic_similarities_values[row_ind][col_ind])

    save_topic_similarities(topic_similarities_dict)


def get_item_similarity(
        reference_exp_category,
        reference_exp_language_code,
        reference_exp_owner_ids,
        compared_exp_category,
        compared_exp_language_code,
        compared_exp_last_updated,
        compared_exp_owner_ids,
        compared_exp_status):
    """Returns the ranking of compared_exp to reference_exp as a
    recommendation. This returns a value between 0.0 to 10.0. A higher value
    indicates the compared_exp is a better recommendation as an exploration to
    start after completing reference_exp.

    Comparison of similarity is based on the similarity of exploration topics
    and whether the explorations have the same language or author. It
    returns 0.0 if compared_exp is private.
    """

    similarity_score = 0

    if compared_exp_status == rights_manager.ACTIVITY_STATUS_PRIVATE:
        return 0

    similarity_score += get_topic_similarity(
        reference_exp_category, compared_exp_category) * 5
    if reference_exp_owner_ids == compared_exp_owner_ids:
        similarity_score += 1
    if reference_exp_language_code == compared_exp_language_code:
        similarity_score += 2

    time_now = datetime.datetime.utcnow()
    time_delta_days = int((time_now - compared_exp_last_updated).days)
    if time_delta_days <= 7:
        similarity_score += 1

    return similarity_score


def set_recommendations(exp_id, new_recommendations):
    """Stores a list of exploration ids of recommended explorations to play
    after completing the exploration keyed by exp_id.
    """

    recommendations_models.ExplorationRecommendationsModel(
        id=exp_id, recommended_exploration_ids=new_recommendations).put()


def get_exploration_recommendations(exp_id):
    """Gets a list of ids of at most 10 recommended explorations to play
    after completing the exploration keyed by exp_id.
    """

    recommendations_model = (
        recommendations_models.ExplorationRecommendationsModel.get(
            exp_id, strict=False))
    if recommendations_model is None:
        return []
    else:
        return recommendations_model.recommended_exploration_ids
