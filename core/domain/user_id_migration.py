# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Jobs for queries personalized to individual users."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import inspect

from core import jobs
from core.platform import models

(base_models, collection_models, exploration_models,
 question_models, skill_models, topic_models,
 user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.collection, models.NAMES.exploration,
     models.NAMES.question, models.NAMES.skill, models.NAMES.topic,
     models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()


class UserIdMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for creating new user ids for all the users and re-adding
    models that use the user id. This migration doesn't handle snapshot content
    models that can contain user ID, these are handled by
    SnapshotsUserIdMigrationJob.
    """

    @staticmethod
    def _copy_model_with_new_id(model_class, old_user_id, new_user_id):
        """Create new model with same values but new id."""
        old_model = model_class.get_by_id(old_user_id)
        if not old_model:
            return
        model_values = old_model.to_dict()
        model_values['id'] = new_user_id
        model_class(**model_values).put(update_last_updated_time=False)
        old_model.delete()

    @staticmethod
    def _copy_model_with_new_id_and_user_id(
            model_class, old_user_id, new_user_id):
        """Create new model with same values but new id and user_id."""
        old_models = model_class.query(
            model_class.get_user_id_migration_field() == old_user_id).fetch()
        for old_model in old_models:
            model_values = old_model.to_dict()
            new_id = '%s.%s' % (new_user_id, old_model.id.split('.')[1])
            model_values['id'] = new_id
            model_values['user_id'] = new_user_id
            model_class(**model_values).put(update_last_updated_time=False)
            old_model.delete()

    @staticmethod
    def _change_model_with_one_user_id_field(
            model_class, old_user_id, new_user_id):
        """Replace field in model with new user id."""
        migration_field = model_class.get_user_id_migration_field()
        found_models = model_class.query(
            migration_field == old_user_id).fetch()
        for model in found_models:
            model_values = model.to_dict()
            model_values[migration_field._name] = new_user_id  # pylint: disable=protected-access
            model.populate(**model_values)
            model.put(update_last_updated_time=False)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_model):
        """Implements the map function for this job."""
        if user_model.id != user_model.gae_id:
            return
        old_user_id = user_model.id
        new_user_id = user_models.UserSettingsModel.get_new_id('user')
        for model_class in models.Registry.get_all_storage_model_classes():
            if (model_class.get_user_id_migration_policy() ==
                    base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE):
                continue
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.COPY):
                UserIdMigrationJob._copy_model_with_new_id(
                    model_class, old_user_id, new_user_id)
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.COPY_PART):
                UserIdMigrationJob._copy_model_with_new_id_and_user_id(
                    model_class, old_user_id, new_user_id)
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD):
                UserIdMigrationJob._change_model_with_one_user_id_field(
                    model_class, old_user_id, new_user_id)
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.CUSTOM):
                model_class.migrate_model(old_user_id, new_user_id)
        yield ('SUCCESS', (old_user_id, new_user_id))

    @staticmethod
    def reduce(key, new_user_ids):
        """Implements the reduce function for this job."""
        yield (key, new_user_ids)


class SnapshotsUserIdMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for going through all the snapshot content models that can
    contain user ID and replacing it with new user ID.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [collection_models.CollectionRightsSnapshotContentModel,
                exploration_models.ExplorationRightsSnapshotContentModel,
                question_models.QuestionRightsSnapshotContentModel,
                skill_models.SkillRightsSnapshotContentModel,
                topic_models.TopicRightsSnapshotContentModel]

    @staticmethod
    def map(snapshot_model):
        """Implements the map function for this job."""
        snapshot_model.migrate_snapshot_model()
        yield ('SUCCESS', snapshot_model.id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        yield (key, ids)


class GaeIdNotInModelsVerificationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for going through all the UserSettingsModels and checking
    that the gae_id is not mentioned in any of the fields that should contain
    user_id.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_model):
        """Implements the map function for this job."""
        gae_id = user_model.gae_id
        for model_class in models.Registry.get_all_storage_model_classes():
            base_classes = [
                base.__name__ for base in inspect.getmro(model_class)]
            # BaseSnapshotMetadataModel and models that inherit from it
            # are checked from the associated VersionedModel.
            if 'BaseSnapshotMetadataModel' in base_classes:
                continue
            # BaseSnapshotContentModel and models that inherit from it
            # are checked from the associated VersionedModel.
            if 'BaseSnapshotContentModel' in base_classes:
                continue
            if (model_class.get_deletion_policy() ==
                    base_models.DELETION_POLICY.NOT_APPLICABLE):
                continue
            if model_class.has_reference_to_user_id(gae_id):
                yield ('FAILURE', (gae_id, model_class.__name__))

        yield ('SUCCESS', (gae_id, ''))

    @staticmethod
    def reduce(key, status):
        """Implements the reduce function for this job."""
        yield (key, status)


class ModelsUserIdsHaveUserSettingsVerificationJob(
    jobs.BaseMapReduceOneOffJobManager):
    """One-off job for going through all the UserSettingsModels and checking
    that the gae_id is not mentioned in any of the fields that should contain
    user_id.
    """

    @staticmethod
    def _check_id_exists(model):
        """Check if UserSettingsModel exists for the model id."""
        return user_models.UserSettingsModel.get_by_id(model.id) is not None

    @staticmethod
    def _check_id_and_user_id_exist(model):
        """Check if UserSettingsModel exists for user_id and model id contains
        user_id.
        """
        return (
            model.user_id == model.id.split('.')[0] and
            user_models.UserSettingsModel.get_by_id(model.user_id) is not None)

    @staticmethod
    def _check_one_field_exists(model, model_class):
        """Check if UserSettingsModel exists for one field.
        """
        verification_field = model_class.get_user_id_migration_field()
        model_values = model.to_dict()
        return user_models.UserSettingsModel.get_by_id(
            model_values[verification_field._name]) is not None  # pylint: disable=protected-access

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return models.Registry.get_all_storage_model_classes()

    @staticmethod
    def map(model):
        """Implements the map function for this job."""
        model_class = model.__class__
        if (model_class.get_user_id_migration_policy() ==
              base_models.USER_ID_MIGRATION_POLICY.COPY):
            if (ModelsUserIdsHaveUserSettingsVerificationJob
                    ._check_id_exists(model)):
                yield ('SUCCESS', model_class.__name__)
            else:
                yield ('FAILURE', model_class.__name__)
        elif (model_class.get_user_id_migration_policy() ==
              base_models.USER_ID_MIGRATION_POLICY.COPY_PART):
            if (ModelsUserIdsHaveUserSettingsVerificationJob
                    ._check_id_and_user_id_exist(model)):
                yield ('SUCCESS', model_class.__name__)
            else:
                yield ('FAILURE', model_class.__name__)

        elif (model_class.get_user_id_migration_policy() ==
              base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD):
            if (ModelsUserIdsHaveUserSettingsVerificationJob
                    ._check_one_field_exists(model, model_class)):
                yield ('SUCCESS', model_class.__name__)
            else:
                yield ('FAILURE', model_class.__name__)
        elif (model_class.get_user_id_migration_policy() ==
              base_models.USER_ID_MIGRATION_POLICY.CUSTOM):
            if model.verify_model_user_ids_exist():
                yield ('SUCCESS', model_class.__name__)
            else:
                yield ('FAILURE', model_class.__name__)

    @staticmethod
    def reduce(key, status):
        """Implements the reduce function for this job."""
        yield (key, status)
