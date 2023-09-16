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

from typing import Dict, Optional, Sequence, Tuple, List

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


class PinnedOpportunityModel(base_models.BaseModel):
    """Model for storing pinned opportunities for a user.

    The ID of each instance is the combination of user_id,
    language_code, and topic_id.
    """

    user_id = datastore_services.StringProperty(required=True, indexed=True)
    language_code = datastore_services.StringProperty(
        required=True, indexed=True)
    topic_id = datastore_services.StringProperty(required=True, indexed=True)
    opportunity_id = datastore_services.StringProperty(indexed=True)

    @classmethod
    def _generate_id(
        cls,
        user_id: str,
        language_code: str,
        topic_id: str
    ) -> str:
        """Generates the ID for the instance of PinnedOpportunityModel class.

        Args:
            user_id: str. The ID of the user.
            language_code: str. The code of the language.
            topic_id: str. The ID of the topic.

        Returns:
            str. The ID for this entity, in the form
            user_id.language_code.topic_id.
        """
        return '%s.%s.%s' % (user_id, language_code, topic_id)

    @classmethod
    def create(
        cls,
        user_id: str,
        language_code: str,
        topic_id: str,
        opportunity_id: str
    ) -> PinnedOpportunityModel:
        """Creates a new PinnedOpportunityModel instance. Fails if the
        model already exists.

        Args:
            user_id: str. The ID of the user.
            language_code: str. The code of the language.
            topic_id: str. The ID of the topic.
            opportunity_id: str. The ID of the pinned opportunity.

        Returns:
            PinnedOpportunityModel. The created instance.

        Raises:
            Exception. There is already a pinned opportunity with
            the given id.
        """
        instance_id = cls._generate_id(user_id, language_code, topic_id)
        if cls.get_by_id(instance_id):
            raise Exception(
                'There is already a pinned opportunity with the given'
                ' id: %s' % instance_id)

        instance = cls(
            id=instance_id, user_id=user_id, language_code=language_code,
                       topic_id=topic_id, opportunity_id=opportunity_id)
        instance.put()
        return instance

    @classmethod
    def get_model(cls, user_id, language_code, topic_id) -> Optional[
        PinnedOpportunityModel]:
        """Fetches the PinnedOpportunityModel instance from the datastore.

        Args:
            user_id: str. The ID of the user.
            language_code: str. The code of the language.
            topic_id: str. The ID of the topic.

        Returns:
            PinnedOpportunityModel. The model instance with the given parameters
            or None if not found.
        """
        return cls.get_by_id(cls._generate_id(user_id, language_code, topic_id))

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of PinnedOpportunityModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        datastore_services.delete_multi(
            cls.query(cls.user_id == user_id).fetch(keys_only=True))

    @classmethod
    def get_deletion_policy(cls) -> base_models.DELETION_POLICY:
        """Model contains data corresponding to a user: user_id."""
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether PinnedOpportunityModel references the
        supplied user.

        Args:
            user_id: str. The ID of the user whose data should be
            checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.user_id == user_id
        ).get(keys_only=True) is not None

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'language_code':
                base_models.EXPORT_POLICY.EXPORTED,
            # User ID is not exported in order to keep internal ids private.
            'user_id':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_id':
                base_models.EXPORT_POLICY.EXPORTED,
            'opportunity_id':
                base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, List[Dict[str, str]]]:
        """Fetches all the data associated with the given user ID.

        Args:
            user_id: str. The ID of the user whose data should be fetched.

        Returns:
            dict. A dictionary containing all the data associated
            with the user.
        """
        user_data = []

        user_models: Sequence[PinnedOpportunityModel] = (
            cls.query(cls.user_id == user_id).fetch())

        for model in user_models:
            user_data.append({
                'language_code': model.language_code,
                'topic_id': model.topic_id,
                'opportunity_id': model.opportunity_id
            })

        return {
            'user_data': user_data
        }

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there are
        multiple languages and topics relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER
