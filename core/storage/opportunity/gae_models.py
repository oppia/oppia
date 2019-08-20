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

from core.platform import models

from google.appengine.datastore import datastore_query
from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class ExplorationOpportunitySummaryModel(base_models.BaseModel):
    """Summary of translation and voiceover opportunities in an exploration.

    The id of each instance is the id of the corresponding exploration.
    """
    topic_id = ndb.StringProperty(required=True, indexed=True)
    topic_name = ndb.StringProperty(required=True, indexed=True)
    story_id = ndb.StringProperty(required=True, indexed=True)
    story_title = ndb.StringProperty(required=True, indexed=True)
    chapter_title = ndb.StringProperty(required=True, indexed=True)
    content_count = ndb.IntegerProperty(required=True, indexed=True)
    incomplete_translation_language_codes = ndb.StringProperty(
        repeated=True, indexed=True)
    translation_counts = ndb.JsonProperty(default={}, indexed=False)
    assigned_voice_artist_in_language_codes = ndb.StringProperty(
        repeated=True, indexed=True)
    need_voice_artist_in_language_codes = ndb.StringProperty(
        repeated=True, indexed=True)

    @classmethod
    def get_all_translation_opportunities(
            cls, page_size, urlsafe_start_cursor, language_code):
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

        Returns:
            3-tuple of (results, cursor, more) as described in fetch_page() at:
            https://developers.google.com/appengine/docs/python/ndb/queryclass,
            where:
                results: list(ExplorationOpportunitySummaryModel)|None. A list
                    of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this might
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        if urlsafe_start_cursor:
            start_cursor = datastore_query.Cursor(urlsafe=urlsafe_start_cursor)
        else:
            start_cursor = datastore_query.Cursor()

        results, cursor, more = cls.query(
            cls.incomplete_translation_language_codes == language_code).order(
                cls.incomplete_translation_language_codes).fetch_page(
                    page_size, start_cursor=start_cursor)
        return (results, (cursor.urlsafe() if cursor else None), more)

    @classmethod
    def get_all_voiceover_opportunities(
            cls, page_size, urlsafe_start_cursor, language_code):
        """Returns a list of opportunities available for voiceover in a
        specific language.

        Args:
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned entities starts from this datastore cursor.
                Otherwise, the returned entities start from the beginning
                of the full list of entities.
            language_code: str. The language for which voiceover opportunities
                to be fetched.

        Returns:
            3-tuple of (results, cursor, more) as described in fetch_page() at:
            https://developers.google.com/appengine/docs/python/ndb/queryclass,
            where:
                results: list(ExplorationOpportunitySummaryModel)|None. A list
                    of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this might
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        if urlsafe_start_cursor:
            start_cursor = datastore_query.Cursor(urlsafe=urlsafe_start_cursor)
        else:
            start_cursor = None

        results, cursor, more = cls.query(
            cls.need_voice_artist_in_language_codes == language_code).order(
                cls.created_on).fetch_page(page_size, start_cursor=start_cursor)
        return (results, (cursor.urlsafe() if cursor else None), more)

    @classmethod
    def get_by_topic(cls, topic_id):
        """Returns all the models corresponding to the specific topic.

        Returns:
            list(ExplorationOpportunitySummaryModel)|None. A list of
            ExplorationOpportunitySummaryModel having given topic_id.
        """
        return cls.query(cls.topic_id == topic_id).fetch()
