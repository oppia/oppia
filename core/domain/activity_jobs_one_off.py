# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""One-off jobs for activities."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core.domain import search_services
from core.platform import models

(collection_models, exp_models, topic_models) = (
    models.Registry.import_models([
        models.NAMES.collection, models.NAMES.exploration, models.NAMES.topic]))


class IndexAllActivitiesJobManager(jobs.BaseMapReduceOneOffJobManager):
    """Job that indexes all explorations and collections and compute their
    ranks.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExpSummaryModel,
                collection_models.CollectionSummaryModel]

    @staticmethod
    def map(item):
        if not item.deleted:
            if isinstance(item, exp_models.ExpSummaryModel):
                search_services.index_exploration_summaries([item])
            else:
                search_services.index_collection_summaries([item])

    @staticmethod
    def reduce(key, values):
        pass


class AddAllUserIdsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """"""

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [collection_models.CollectionRightsModel,
                exp_models.ExplorationRightsModel,
                topic_models.TopicRightsModel]

    @staticmethod
    def map(rights_model):
        """Implements the map function for this job."""
        if (isinstance(rights_model, collection_models.CollectionRightsModel) or
                isinstance(rights_model, exp_models.ExplorationRightsModel)):
            rights_model.all_user_ids = list(
                set(rights_model.owner_ids) |
                set(rights_model.editor_ids) |
                set(rights_model.voice_artist_ids) |
                set(rights_model.viewer_ids))
            rights_model.put(update_last_updated_time=False)
        elif isinstance(rights_model, topic_models.TopicRightsModel):
            rights_model.all_user_ids = rights_model.manager_ids
            rights_model.put(update_last_updated_time=False)
        class_name = rights_model.__class__.__name__
        yield ('SUCCESS - %s' % class_name, rights_model.id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        yield (key, len(ids))


class AddAllUserIdsSnapshotsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """"""

    @staticmethod
    def _migrate_collection(rights_snapshot_model):
        """
        """
        content_dict = (
            collection_models.CollectionRightsModel.transform_dict_to_valid(
                rights_snapshot_model.content))
        reconstituted_rights_model = (
            collection_models.CollectionRightsModel(**content_dict))

        rights_model = collection_models.CollectionRightsModel.get_by_id(
            reconstituted_rights_model.id)
        rights_model.all_user_ids = list(
            set(rights_model.all_user_ids) |
            set(reconstituted_rights_model.owner_ids) |
            set(reconstituted_rights_model.editor_ids) |
            set(reconstituted_rights_model.voice_artist_ids) |
            set(reconstituted_rights_model.viewer_ids))
        rights_model.put(update_last_updated_time=False)

    @staticmethod
    def _migrate_exploration(rights_snapshot_model):
        """
        """
        content_dict = (
            collection_models.ExplorationRightsModel.transform_dict_to_valid(
                rights_snapshot_model.content))
        reconstituted_rights_model = (
            collection_models.ExplorationRightsModel(**content_dict))

        rights_model = exp_models.ExplorationRightsModel.get_by_id(
            reconstituted_rights_model.id)
        rights_model.all_user_ids = list(
            set(rights_model.all_user_ids) |
            set(reconstituted_rights_model.owner_ids) |
            set(reconstituted_rights_model.editor_ids) |
            set(reconstituted_rights_model.voice_artist_ids) |
            set(reconstituted_rights_model.viewer_ids))
        rights_model.put(update_last_updated_time=False)

    @staticmethod
    def _migrate_topic(rights_snapshot_model):
        """
        """
        reconstituted_rights_model = topic_models.TopicRightsModel(
            **rights_snapshot_model.content)
        rights_model = topic_models.TopicRightsModel.get_by_id(
            reconstituted_rights_model.id)
        rights_model.all_user_ids = list(
            set(rights_model.all_user_ids) | set(rights_model.manager_ids))
        rights_model.put(update_last_updated_time=False)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [collection_models.CollectionRightsSnapshotContentModel,
                exp_models.ExplorationRightsSnapshotContentModel,
                topic_models.TopicRightsSnapshotContentModel]

    @staticmethod
    def map(rights_snapshot_model):
        """Implements the map function for this job."""
        if isinstance(
                rights_snapshot_model,
                collection_models.CollectionRightsSnapshotContentModel):
            AddAllUserIdsSnapshotsOneOffJob._migrate_collection(
                rights_snapshot_model)
        elif isinstance(
                rights_snapshot_model,
                exp_models.ExplorationRightsSnapshotContentModel):
            AddAllUserIdsSnapshotsOneOffJob._migrate_exploration(
                rights_snapshot_model)
        elif isinstance(
                rights_snapshot_model,
                topic_models.TopicRightsSnapshotContentModel):
            AddAllUserIdsSnapshotsOneOffJob._migrate_topic(
                rights_snapshot_model)
        class_name = rights_snapshot_model.__class__.__name__
        yield ('SUCCESS - %s' % class_name, rights_snapshot_model.id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        yield (key, len(ids))
