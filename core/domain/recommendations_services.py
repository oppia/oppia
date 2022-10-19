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

from __future__ import annotations

import csv
import datetime
import io
import json

from core import feconf
from core.domain import exp_domain
from core.domain import rights_domain
from core.platform import models

from typing import Dict, Final, List, Sequence, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import recommendations_models

(recommendations_models,) = models.Registry.import_models([
    models.Names.RECOMMENDATIONS
])


# pylint: disable=line-too-long, single-line-pragma
DEFAULT_TOPIC_SIMILARITIES_STRING: Final = (
    """Architecture,Art,Biology,Business,Chemistry,Computing,Economics,Education,Engineering,Environment,Geography,Government,Hobbies,Languages,Law,Life Skills,Mathematics,Medicine,Music,Philosophy,Physics,Programming,Psychology,Puzzles,Reading,Religion,Sport,Statistics,Welcome
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
# pylint: enable=line-too-long, single-line-pragma

RECOMMENDATION_CATEGORIES: Final = [
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


def get_topic_similarities_dict() -> Dict[str, Dict[str, float]]:
    """Returns a 2d dict of topic similarities. Creates the default similarity
    dict if it does not exist yet.
    """

    topic_similarities_entity = (
        recommendations_models.TopicSimilaritiesModel.get(
            recommendations_models.TOPIC_SIMILARITIES_ID, strict=False))
    if topic_similarities_entity is None:
        topic_similarities_entity = create_default_topic_similarities()

    # TODO(#15610): Here we use cast because the return type of json.loads()
    # method is Dict[str, Any] but from the implementation we know it only
    # returns the values of type Dict[str, Dict[str, float]. So to narrow down
    # the type from Dict[str, Any], we used cast here.
    return cast(
        Dict[str, Dict[str, float]],
        json.loads(topic_similarities_entity.content)
    )


def save_topic_similarities(
    topic_similarities: Dict[str, Dict[str, float]]
) -> recommendations_models.TopicSimilaritiesModel:
    """Stores topic similarities in the datastore. Returns the newly created or
    changed entity.
    """

    retrieved_topic_similarities_entity = (
        recommendations_models.TopicSimilaritiesModel.get(
            recommendations_models.TOPIC_SIMILARITIES_ID, strict=False))
    topic_similarities_entity = (
        retrieved_topic_similarities_entity
        if retrieved_topic_similarities_entity is not None
        else recommendations_models.TopicSimilaritiesModel(
            id=recommendations_models.TOPIC_SIMILARITIES_ID
        )
    )
    topic_similarities_entity.content = json.dumps(topic_similarities)
    topic_similarities_entity.update_timestamps()
    topic_similarities_entity.put()

    return topic_similarities_entity


def create_default_topic_similarities(
) -> recommendations_models.TopicSimilaritiesModel:
    """Creates the default topic similarities, and stores them in the datastore.
    The keys are names of the default categories, and values are
    DEFAULT_TOPIC_SIMILARITY if the keys are different and
    SAME_TOPIC_SIMILARITY if the keys are the same.

    Returns the newly created TopicSimilaritiesModel.
    """

    topic_similarities_dict: Dict[str, Dict[str, float]] = {
        topic: {} for topic in RECOMMENDATION_CATEGORIES
    }
    raw_data = DEFAULT_TOPIC_SIMILARITIES_STRING.splitlines()
    data = list(csv.reader(raw_data))
    topics_list = data[0]
    topic_similarities_values = data[1:]
    for row_ind, topic_1 in enumerate(topics_list):
        for col_ind, topic_2 in enumerate(topics_list):
            topic_similarities_dict[topic_1][topic_2] = float(
                topic_similarities_values[row_ind][col_ind])

    return save_topic_similarities(topic_similarities_dict)


def get_topic_similarity(topic_1: str, topic_2: str) -> float:
    """Gets the similarity between two topics, as a float between 0 and 1.

    It checks whether the two topics are in the list of default topics. If
    not, it returns the default similarity if the topics are different or 1 if
    the topics are the same.
    """

    if (
            topic_1 in RECOMMENDATION_CATEGORIES and
            topic_2 in RECOMMENDATION_CATEGORIES
    ):
        topic_similarities = get_topic_similarities_dict()
        return topic_similarities[topic_1][topic_2]
    else:
        if topic_1 == topic_2:
            return feconf.SAME_TOPIC_SIMILARITY
        else:
            return feconf.DEFAULT_TOPIC_SIMILARITY


def get_topic_similarities_as_csv() -> str:
    """Downloads all similarities corresponding to the current topics as a
    string which contains the contents of a csv file.

    The first line is a list of the current topics. The next lines are an
    adjacency matrix of similarities.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(RECOMMENDATION_CATEGORIES)

    topic_similarities = get_topic_similarities_dict()
    for topic in RECOMMENDATION_CATEGORIES:
        topic_similarities_row = [value for _, value in sorted(
            topic_similarities[topic].items())]
        writer.writerow(topic_similarities_row)

    return output.getvalue()


def validate_topic_similarities(csv_data: str) -> None:
    """Validates topic similarities given by data, which should be a string
    of comma-separated values.

    The first line of data should be a list of topic names. The next lines
    should be a symmetric adjacency matrix of similarities, which are floats
    between 0.0 and 1.0.

    This function checks whether topics belong in the current list of
    known topics, and if the adjacency matrix is valid.
    """
    raw_data = csv_data.splitlines()
    data = list(csv.reader(raw_data))
    topics_list = data[0]
    topics_length = len(topics_list)
    topic_similarities_values = data[1:]

    if len(topic_similarities_values) != topics_length:
        raise Exception(
            'Length of topic similarities columns: %s '
            'does not match length of topic list: %s.' % (
                len(topic_similarities_values), topics_length))

    for topic in topics_list:
        if topic not in RECOMMENDATION_CATEGORIES:
            raise Exception('Topic %s not in list of known topics.' % topic)

    for index, topic in enumerate(topics_list):
        if len(topic_similarities_values[index]) != topics_length:
            raise Exception(
                'Length of topic similarities rows: %s '
                'does not match length of topic list: %s.' % (
                    len(topic_similarities_values[index]), topics_length))

    for row_ind in range(topics_length):
        for col_ind in range(topics_length):
            similarity_value = topic_similarities_values[row_ind][col_ind]
            try:
                float(similarity_value)
            except ValueError as e:
                raise ValueError(
                    'Expected similarity to be a float, received %s' % (
                        similarity_value)) from e

            similarity = float(similarity_value)
            if similarity < 0.0 or similarity > 1.0:
                raise ValueError(
                    'Expected similarity to be between 0.0 and '
                    '1.0, received %s' % similarity)

    for row_ind in range(topics_length):
        for col_ind in range(topics_length):
            if (topic_similarities_values[row_ind][col_ind] !=
                    topic_similarities_values[col_ind][row_ind]):
                raise Exception('Expected topic similarities to be symmetric.')


def update_topic_similarities(csv_data: str) -> None:
    """Updates all topic similarity pairs given by data, which should be a
    string of comma-separated values.

    The first line of data should be a list of topic names. The next lines
    should be a symmetric adjacency matrix of similarities, which are floats
    between 0.0 and 1.0.

    The topic names should belong to the current list of topics, but they need
    not include every current topic. If a topic name is not in the data, its
    similarities remain as the previous value or the default.
    """

    validate_topic_similarities(csv_data)

    raw_data = csv_data.splitlines()
    data = list(csv.reader(raw_data))
    topics_list = data[0]
    topic_similarities_values = data[1:]

    topic_similarities_dict = get_topic_similarities_dict()
    for row_ind, topic_1 in enumerate(topics_list):
        for col_ind, topic_2 in enumerate(topics_list):
            topic_similarities_dict[topic_1][topic_2] = float(
                topic_similarities_values[row_ind][col_ind])

    save_topic_similarities(topic_similarities_dict)


def get_item_similarity(
    reference_exp_summary: exp_domain.ExplorationSummary,
    compared_exp_summary: exp_domain.ExplorationSummary
) -> float:
    """Returns the ranking of compared_exp to reference_exp as a
    recommendation. This returns a value between 0.0 to 10.0. A higher value
    indicates the compared_exp is a better recommendation as an exploration to
    start after completing reference_exp.

    Comparison of similarity is based on the similarity of exploration topics
    and whether the explorations have the same language or author. It
    returns 0.0 if compared_exp is private.

    Args:
        reference_exp_summary: ExplorationSummary. The reference exploration
            summary. The similarity score says how similar is
            the compared summary to this summary.
        compared_exp_summary: ExplorationSummary. The compared exploration
            summary. The similarity score says how similar is this summary to
            the reference summary.

    Returns:
        float. The similarity score.
    """

    similarity_score = 0.0

    if compared_exp_summary.status == rights_domain.ACTIVITY_STATUS_PRIVATE:
        return 0.0

    topic_similarity_score = get_topic_similarity(
        reference_exp_summary.category, compared_exp_summary.category
    )

    similarity_score += 5.0 * topic_similarity_score
    if reference_exp_summary.owner_ids == compared_exp_summary.owner_ids:
        similarity_score += 1.0
    if (
            reference_exp_summary.language_code ==
            compared_exp_summary.language_code
    ):
        similarity_score += 2.0

    time_now = datetime.datetime.utcnow()
    time_delta_days = int(
        (time_now - compared_exp_summary.exploration_model_last_updated).days)
    if time_delta_days <= 7:
        similarity_score += 1.0

    return similarity_score


def set_exploration_recommendations(
    exp_id: str, new_recommendations: List[str]
) -> None:
    """Stores a list of exploration ids of recommended explorations to play
    after completing the exploration keyed by exp_id.

    Args:
        exp_id: str. The ID of the exploration for which to set
            the recommendations.
        new_recommendations: list(str). The new recommended exploration IDs
            to set.
    """

    recommendations_models.ExplorationRecommendationsModel(
        id=exp_id, recommended_exploration_ids=new_recommendations).put()


def get_exploration_recommendations(exp_id: str) -> List[str]:
    """Gets a list of ids of at most 10 recommended explorations to play
    after completing the exploration keyed by exp_id.

    Args:
        exp_id: str. The ID of the exploration for which to get
            the recommendations.

    Returns:
        list(str). List of recommended explorations IDs.
    """

    recommendations_model = (
        recommendations_models.ExplorationRecommendationsModel.get(
            exp_id, strict=False))
    if recommendations_model is None:
        return []
    else:
        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        recommended_exploration_ids: List[str] = (
            recommendations_model.recommended_exploration_ids
        )
        return recommended_exploration_ids


def delete_explorations_from_recommendations(exp_ids: List[str]) -> None:
    """Deletes explorations from recommendations.

    This deletes both the recommendations for the given explorations, as well as
    the given explorations from other explorations' recommendations.

    Args:
        exp_ids: list(str). List of exploration IDs for which to delete
            the recommendations.
    """
    recs_model_class = (
        recommendations_models.ExplorationRecommendationsModel)
    recommendation_models = recs_model_class.get_multi(exp_ids)
    existing_recommendation_models = [
        model for model in recommendation_models if model is not None]
    recs_model_class.delete_multi(existing_recommendation_models)

    # We use dictionary here since we do not want to have duplicate models. This
    # could happen when one recommendation contains ids of two explorations that
    # are both to be deleted. We cannot use sets since they require immutable
    # objects.
    all_recommending_models = {}
    for exp_id in exp_ids:
        recommending_models: Sequence[
            recommendations_models.ExplorationRecommendationsModel
        ] = recs_model_class.query(
            recs_model_class.recommended_exploration_ids == exp_id
        ).fetch()
        for recommending_model in recommending_models:
            all_recommending_models[recommending_model.id] = (
                recommending_model)

    for recommending_model in all_recommending_models.values():
        for exp_id in exp_ids:
            recommending_model.recommended_exploration_ids.remove(exp_id)

    entities = list(all_recommending_models.values())
    recs_model_class.update_timestamps_multi(entities)
    recs_model_class.put_multi(entities)
