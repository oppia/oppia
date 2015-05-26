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

"""Models for Oppia recommendations."""

__author__ = 'Xinyu Wu'

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])
import feconf

from google.appengine.ext import ndb


class ExplorationRecommendationModel(base_models.BaseModel):
    """A list of recommended explorations similar to an exploration.

    Instances of this class are keyed by exploration ID."""

    # ID of exploration
    exploration_id = ndb.StringProperty(required=True, indexed=True)

    # IDs of recommended explorations
    recommendations = ndb.StringProperty(repeated=True, indexed=False)


class TopicSimilarityModel(base_models.BaseModel):
    """The similarity between two categories, stored as a real number between
    0 and 1.

    Instances of this class are keyed by [topic_1].[topic_2], and topic_1 must
    be lexographically smaller than topic_2.

    Currently, topics are the same as the default categories. However this may
    be extended in the future."""

    # ID of categories
    topic_1 = ndb.StringProperty(required=True, indexed=True)
    topic_2 = ndb.StringProperty(required=True, indexed=True)

    # Similarity value
    similarity = ndb.FloatProperty(
        default=feconf.DEFAULT_TOPIC_SIMILARITY, indexed=False)

    @classmethod
    def get_entity_id(cls, topic_1, topic_2):
        return '%s:%s' % (topic_1, topic_2)

    @classmethod
    def get_or_create(cls, topic_1, topic_2):
        """Gets the TopicSimilarityModel corresponding to the given topic
        names or creates a new TopicSimilarityModel with the default values if
        it doesn't exist yet."""

        if topic_1 > topic_2:
            topic_1, topic_2 = topic_2, topic_1

        entity_id = cls.get_entity_id(topic_1, topic_2)

        entity = cls.get(entity_id, strict=False)
        if not entity:
            if topic_1 != topic_2:
                topic_similarity = feconf.DEFAULT_TOPIC_SIMILARITY
            else:
                topic_similarity = feconf.SAME_TOPIC_SIMILARITY
            entity = cls(
                id=entity_id,
                topic_1=topic_1,
                topic_2=topic_2,
                similarity=topic_similarity)
            entity.put()

        return entity

    @classmethod
    def get_or_create_multi(cls, topics_list):
        """Gets or creates the TopicSimilarityModel corresponding to the given
        topic names in topics_list. topics_list should be a list of lists of 2
        elements, the names of the two topics to be queried."""

        for topics in topics_list:
            if topics[0] > topics[1]:
                topics[0], topics[1] = topics[1], topics[0]

        entity_ids = [cls.get_entity_id(topics[0], topics[1])
                      for topics in topics_list]

        entities = cls.get_multi(entity_ids)
        entities_to_put = []
        for index, entity in enumerate(entities):
            if not entity:
                if topics_list[index][0] != topics_list[index][1]:
                    topic_similarity = feconf.DEFAULT_TOPIC_SIMILARITY
                else:
                    topic_similarity = feconf.SAME_TOPIC_SIMILARITY
                new_entity = cls(
                    id=entity_ids[index],
                    topic_1=topics_list[index][0],
                    topic_2=topics_list[index][1],
                    similarity=topic_similarity)
                entities_to_put.append(new_entity)
                entities[index] = new_entity

        cls.put_multi(entities_to_put)
        return entities
