# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

__author__ = 'Xinyu Wu'

from core.platform import models
(recommendations_models, exp_models,) = models.Registry.import_models([
    models.NAMES.recommendations, models.NAMES.exploration])
import csv
import datetime
import feconf
import StringIO


def get_topic_similarity(topic_1, topic_2):
    """Gets the similarity between two topics.

    It checks whether the two topics are in the list of default topics. If
    not, it returns the default similarity if the topics are different or 1 if
    the topics are the same. If both topics are in the list of default topics
    and the similarity does not exist, a new item is created with a similarity
    of the default similarity"""

    if (topic_1 in feconf.DEFAULT_CATEGORIES and
            topic_2 in feconf.DEFAULT_CATEGORIES):
        topic_similarity_model = (recommendations_models.TopicSimilarityModel
                                  .get_or_create(topic_1, topic_2))
        return topic_similarity_model.similarity
    else:
        if topic_1 == topic_2:
            return feconf.DEFAULT_TOPIC_SIMILARITY
        else:
            return feconf.SAME_TOPIC_SIMILARITY


def download_topic_similarities():
    """Downloads all similarities corresponding to the current topics as a csv
    file.

    The first line is a list of the current topics. The next lines are an
    adjacency matrix of similarities."""

    query_topics = []
    for topic_1 in feconf.DEFAULT_CATEGORIES:
        for topic_2 in feconf.DEFAULT_CATEGORIES:
            query_topics.append([topic_1, topic_2])

    topics_length = len(feconf.DEFAULT_CATEGORIES)
    topic_similarity_entities = (recommendations_models.TopicSimilarityModel
                                 .get_or_create_multi(query_topics))

    output = StringIO.StringIO()
    writer = csv.writer(output)
    writer.writerow(feconf.DEFAULT_CATEGORIES)

    for index in range(0, len(topic_similarity_entities), topics_length):
        topic_similarities = [entity.similarity
                              for entity in topic_similarity_entities[
                                  index:index + topics_length]]
        writer.writerow(topic_similarities)

    return output.getvalue()


def update_topic_similarities(data):
    """Updates all topic similarity pairs given by data, which should be a
    string of comma-separated values.

    The first line of data should be a list of topic names. The next lines
    should be a symmetric adjacency matrix of similarities, which are floats
    between 0 and 1."""

    data = data.splitlines()
    data = list(csv.reader(data))
    topics_list = data[0]
    topics_length = len(topics_list)
    topic_similarities = data[1:]

    if len(topic_similarities) != topics_length:
        raise Exception(
            'Length of topic similarities does not match topic list.')

    for topic in topics_list:
        if topic not in feconf.DEFAULT_CATEGORIES:
            raise Exception('Topic %s not in list of known topics.', topic)

    for index, topic in enumerate(topics_list):
        if len(topic_similarities[index]) != topics_length:
            raise Exception(
                'Length of topic similarities does not match topic list.')

    for row_ind in range(topics_length):
        for col_ind in range(topics_length):
            similarity = topic_similarities[row_ind][col_ind]
            try:
                similarity = float(similarity)
            except:
                raise ValueError('Expected similarity to be a float, ' +
                                 'received %s' % similarity)

            if similarity < 0.0 or similarity > 1.0:
                raise ValueError('Expected similarity to be between ' +
                                 '0 and 1, received %s'
                                 % similarity)

            topic_similarities[row_ind][col_ind] = similarity

    query_topics = []
    for topic_1 in topics_list:
        for topic_2 in topics_list:
            query_topics.append([topic_1, topic_2])

    topic_similarity_entities = (recommendations_models.TopicSimilarityModel
                                 .get_or_create_multi(query_topics))

    for row_ind in range(topics_length):
        for col_ind, entity in enumerate(
                topic_similarity_entities[
                row_ind * topics_length:row_ind * (topics_length + 1)]):
            entity.similarity = topic_similarities[row_ind][col_ind]

    recommendations_models.TopicSimilarityModel.put_multi(
        topic_similarity_entities)


def get_item_similarity(exploration_1_id, exploration_2_id):
    """Returns the similarity of exploration_2 to exploration_1, where a
    higher score indicates the explorations are more similar.

    Returns 0 if exploration_2 is private."""

    exploration_1 = exp_models.ExpSummaryModel.get_by_id(exploration_1_id)
    exploration_2 = exp_models.ExpSummaryModel.get_by_id(exploration_2_id)

    similarity_score = 0

    if exploration_2.status == exp_models.EXPLORATION_STATUS_PRIVATE:
        return 0
    elif exploration_2.status == exp_models.EXPLORATION_STATUS_PUBLICIZED:
        similarity_score += 1

    similarity_score += get_topic_similarity(
        exploration_1.category, exploration_2.category) * 5
    if exploration_1.owner_ids == exploration_2.owner_ids:
        similarity_score += 1
    if exploration_1.language_code == exploration_2.language_code:
        similarity_score += 2

    _BEGINNING_OF_TIME = datetime.datetime(2013, 6, 30)
    time_delta_days = int((
        exploration_2.last_updated - _BEGINNING_OF_TIME).days)
    if time_delta_days <= 7:
        similarity_score += 1

    return similarity_score
