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

"""Models for Oppia users."""

from __future__ import annotations

from core.platform import models

from typing import Dict, Optional, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()


class ExplorationOpportunitySummaryModel(base_models.BaseModel):
    """Summary of translation and voiceover opportunities in an exploration.

    The id of each instance is the id of the corresponding exploration.
    """

    topic_id = datastore_services.StringProperty(required=True, indexed=True)
    topic_name = datastore_services.StringProperty(required=True, indexed=True)
    story_id = datastore_services.StringProperty(required=True, indexed=True)
    story_title = datastore_services.StringProperty(required=True, indexed=True)
    chapter_title = (
        datastore_services.StringProperty(required=True, indexed=True))
    content_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    incomplete_translation_language_codes = datastore_services.StringProperty(
        repeated=True, indexed=True)
    translation_counts = (
        datastore_services.JsonProperty(default={}, indexed=False))
    language_codes_with_assigned_voice_artists = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    language_codes_needing_voice_artists = datastore_services.StringProperty(
        repeated=True, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'topic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'chapter_title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'content_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'incomplete_translation_language_codes':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'translation_counts': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_codes_with_assigned_voice_artists':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_codes_needing_voice_artists':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    # TODO(#13523): Change the return value of the function below from
    # tuple(list, str|None, bool) to a domain object.
    @classmethod
    def get_all_translation_opportunities(
        cls,
        page_size: int,
        urlsafe_start_cursor: Optional[str],
        language_code: str,
        topic_name: Optional[str]
    ) -> Tuple[
        Sequence[ExplorationOpportunitySummaryModel], Optional[str], bool
    ]:
        """Returns a list of opportunities available for translation in a
        specific language.

        Args:
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned entities starts from this datastore cursor.
                Otherwise, the returned entities start from the beginning
                of the full list of entities.
            language_code: str. The language for which translation opportunities
                are to be fetched.
            topic_name: str or None. The topic for which translation
                opportunities should be fetched. If topic_name is None or empty,
                fetch translation opportunities from all topics.

        Returns:
            3-tuple of (results, cursor, more). As described in fetch_page() at:
            https://developers.google.com/appengine/docs/python/ndb/queryclass,
            where:
                results: list(ExplorationOpportunitySummaryModel). A list
                    of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this might
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        if urlsafe_start_cursor:
            start_cursor = datastore_services.make_cursor(
                urlsafe_cursor=urlsafe_start_cursor)
        else:
            start_cursor = datastore_services.make_cursor()

        language_query = cls.query(
            cls.incomplete_translation_language_codes == language_code
        ).order(cls.topic_name)

        if topic_name:
            language_query = language_query.filter(cls.topic_name == topic_name)

        fetch_result: Tuple[
            Sequence[ExplorationOpportunitySummaryModel],
            datastore_services.Cursor,
            bool
        ] = language_query.fetch_page(page_size, start_cursor=start_cursor)
        results, cursor, _ = fetch_result

        # TODO(#13462): Refactor this so that we don't do the lookup.
        # Do a forward lookup so that we can know if there are more values.
        fetch_result = (
            language_query.fetch_page(page_size + 1, start_cursor=start_cursor))
        plus_one_query_models, _, _ = fetch_result
        more_results = len(plus_one_query_models) == page_size + 1

        # The urlsafe returns bytes and we need to decode them to string.
        return (
            results,
            (cursor.urlsafe().decode('utf-8') if cursor else None),
            more_results
        )

    @classmethod
    def get_by_topic(
        cls, topic_id: str
    ) -> Sequence[ExplorationOpportunitySummaryModel]:
        """Returns all the models corresponding to the specific topic.

        Returns:
            list(ExplorationOpportunitySummaryModel). A list of
            ExplorationOpportunitySummaryModel having given topic_id.
        """
        return cls.query(cls.topic_id == topic_id).fetch()


class SkillOpportunityModel(base_models.BaseModel):
    """Model for opportunities to add questions to skills.

    The id of each instance is the id of the corresponding skill.

    A new instance of this model is created each time a SkillModel is created.
    When a SkillModel's skill description changes, the corresponding instance
    of this model is also updated.
    """

    # The description of the opportunity's skill.
    skill_description = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The number of questions associated with this opportunity's skill.
    question_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'skill_description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_count': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    # TODO(#13523): Change the return value of the function below from
    # tuple(list, str|None, bool) to a domain object.
    @classmethod
    def get_skill_opportunities(
        cls, page_size: int, urlsafe_start_cursor: Optional[str]
    ) -> Tuple[Sequence[SkillOpportunityModel], Optional[str], bool]:
        """Returns a list of skill opportunities available for adding questions.

        Args:
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned entities starts from this datastore cursor.
                Otherwise, the returned entities start from the beginning
                of the full list of entities.

        Returns:
            3-tuple of (results, cursor, more). As described in fetch_page() at:
            https://developers.google.com/appengine/docs/python/ndb/queryclass,
            where:
                results: list(SkillOpportunityModel). A list
                    of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this might
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        start_cursor = datastore_services.make_cursor(
            urlsafe_cursor=urlsafe_start_cursor)

        created_on_query = cls.get_all().order(cls.created_on)
        fetch_result: Tuple[
            Sequence[SkillOpportunityModel], datastore_services.Cursor, bool
        ] = created_on_query.fetch_page(page_size, start_cursor=start_cursor)
        query_models, cursor, _ = fetch_result
        # TODO(#13462): Refactor this so that we don't do the lookup.
        # Do a forward lookup so that we can know if there are more values.
        fetch_result = created_on_query.fetch_page(
            page_size + 1, start_cursor=start_cursor)
        plus_one_query_models, _, _ = fetch_result
        more_results = len(plus_one_query_models) == page_size + 1
        # The urlsafe returns bytes and we need to decode them to string.
        return (
            query_models,
            (cursor.urlsafe().decode('utf-8') if cursor else None),
            more_results
        )


class TranslationOpportunityModel(base_models.BaseModel):
    """Model for tracking translation opportunities for different entities.

    There is only one instance of this model per entity (exploration, skill,
    topic, story, classroom). The ID of the instance is composed of:
    entity_type.entity_id
    """

    # The type of the entity (e.g., 'exploration', 'skill', etc.)
    entity_type = datastore_services.StringProperty(required=True, indexed=True)
    # The ID of the entity.
    entity_id = datastore_services.StringProperty(required=True, indexed=True)
    # A list of topic IDs that are related to this opportunity.
    topic_ids = datastore_services.StringProperty(repeated=True, indexed=True)
    # The total number of contents available for translation.
    content_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # List of language codes in which the entity translation is incomplete.
    incomplete_translation_language_codes = datastore_services.StringProperty(
        repeated=True, indexed=True)
    # Dict mapping language codes to number of completed translations.
    translation_counts = datastore_services.JsonProperty(
        required=True, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """This model does not contain user-specific data."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
        ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """This model is not associated with any user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """This model does not contain user-specific data."""
        return dict(super(cls, cls).get_export_policy(), **{
            'entity_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'content_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'incomplete_translation_language_codes':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'translation_counts': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })

    def _pre_put_hook(self) -> None:
        """Validates model properties before saving."""
        super()._pre_put_hook()

        # Check if entity_type is valid.
        valid_entity_types = {
            'exploration', 'skill', 'topic', 'story', 'classroom'
        }
        if self.entity_type not in valid_entity_types:
            raise Exception(f'Invalid entity_type: {self.entity_type}')

        # Ensure counts are valid.
        if self.content_count < 0:
            raise Exception('content_count cannot be negative.')

        for lang_code, count in self.translation_counts.items():
            if not isinstance(count, int) or count < 0:
                raise Exception(
                    f'Invalid translation count for {lang_code}: {count}')
            if count > self.content_count:
                raise Exception(
                    f'Translation count for {lang_code} ({count}) exceeds '
                    f'content_count ({self.content_count})')

    @staticmethod
    def _generate_id(
        entity_type: str,
        entity_id: str
    ) -> str:
        """Generates a unique ID for a translation opportunity.

        Args:
            entity_type: str. The type of the entity (e.g., 'exploration').
            entity_id: str. The ID of the entity.

        Returns:
            str. A unique string ID in the form: {entity_type}.{entity_id}.
        """
        return f'{entity_type}.{entity_id}'

    @classmethod
    def create_new(
        cls,
        entity_type: str,
        entity_id: str,
        topic_ids: Sequence[str],
        content_count: int,
        incomplete_translation_language_codes: Sequence[str],
        translation_counts: Dict[str, int]
    ) -> TranslationOpportunityModel:
        """Creates and returns a new TranslationOpportunityModel instance.

        Args:
            entity_type: str. The type of the entity.
            entity_id: str. The ID of the entity.
            topic_ids: list(str). Related topic IDs.
            content_count: int. Total number of translatable content items.
            incomplete_translation_language_codes: list(str). Languages with
                incomplete translation.
            translation_counts: dict(str, int). Map of language codes to
                completed translation counts.

        Returns:
            TranslationOpportunityModel. A newly created model instance.
        """
        return cls(
            id=cls._generate_id(entity_type, entity_id),
            entity_type=entity_type,
            entity_id=entity_id,
            topic_ids=list(topic_ids),
            content_count=content_count,
            incomplete_translation_language_codes=list(
                incomplete_translation_language_codes),
            translation_counts=translation_counts
        )
