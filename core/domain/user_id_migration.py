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
import feconf

(
    base_models, collection_models,
    exp_models, question_models, skill_models,
    topic_models, user_models) = models.Registry.import_models(
        [models.NAMES.base_model, models.NAMES.collection,
         models.NAMES.exploration, models.NAMES.question, models.NAMES.skill,
         models.NAMES.topic, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()

# These models have around hundred thousand datastore entries on production and
# need to be in a separate one-off job in order to make the one-off jobs more
# efficient.
SEPARATE_MODEL_CLASSES = [
    exp_models.ExplorationCommitLogEntryModel,
    exp_models.ExplorationSnapshotMetadataModel]


class MissingUserException(Exception):
    """Exception for cases when the user doesn't exist."""
    pass


class UserIdMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for creating new user ids for all the users and re-adding
    models that use the user id. This migration doesn't handle snapshot content
    models that can contain user ID, these are handled by
    SnapshotsUserIdMigrationJob.
    """

    @staticmethod
    def _copy_model_with_new_id(model_class, old_user_id, new_user_id):
        """Create new model with same values but new id.

        Args:
            model_class: class. The class of the migrated model.
            old_user_id: str. The old (GAE) ID of the user being migrated.
            new_user_id: str. The newly generated ID of the user being migrated.

        Returns:
            optional((str, (str, str)).
        """
        old_model = model_class.get_by_id(old_user_id)
        if not old_model:
            # Some models are defined only for some users (for example
            # UserSubscribersModel, is only defined for users who actually have
            # at least one subscriber) that is why we are okay with the fact
            # that model is None.
            return ('MISSING OLD MODEL', (old_user_id, new_user_id))
        model_values = old_model.to_dict()
        model_values['id'] = new_user_id
        new_model = model_class(**model_values)

        def _replace_model():
            """Replace old model with new one."""
            new_model.put(update_last_updated_time=False)
            old_model.delete()

        transaction_services.run_in_transaction(_replace_model)

    @staticmethod
    def _copy_model_with_new_id_and_user_id(
            model_class, old_user_id, new_user_id):
        """Create new model with same values but new id and user_id.

        Args:
            model_class: class. The class of the migrated model.
            old_user_id: str. The old (GAE) ID of the user being migrated.
            new_user_id: str. The newly generated ID of the user being migrated.
        """
        old_models = model_class.query(
            model_class.user_id == old_user_id).fetch()
        new_models = []
        for old_model in old_models:
            model_values = old_model.to_dict()
            new_id = old_model.id.replace(old_user_id, new_user_id)
            model_values['id'] = new_id
            model_values['user_id'] = new_user_id
            new_models.append(model_class(**model_values))

        def _replace_models():
            """Replace old models with new ones."""
            model_class.put_multi(new_models, update_last_updated_time=False)
            model_class.delete_multi(old_models)

        transaction_services.run_in_transaction(_replace_models)

    @staticmethod
    def _change_model_with_one_user_id_field(
            model_class, old_user_id, new_user_id):
        """Replace field in model with new user id.

        Args:
            model_class: class. The class of the migrated model.
            old_user_id: str. The old (GAE) ID of the user being migrated.
            new_user_id: str. The newly generated ID of the user being migrated.
        """
        migration_field = model_class.get_user_id_migration_field()
        found_models = model_class.query(
            migration_field == old_user_id).fetch()
        for model in found_models:
            model_values = model.to_dict()
            # We need to get the name of the migration_field in order to
            # retrieve its value from the model_values. The migration_field
            # needs to be in the object format so that we are able to form
            # the model query easily (on one of the previous lines).
            model_values[migration_field._name] = new_user_id  # pylint: disable=protected-access
            model.populate(**model_values)
            model_class.put_multi([model], update_last_updated_time=False)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_model):
        """Implements the map function for this job."""
        if user_model.id != user_model.gae_id:
            yield ('ALREADY DONE', (user_model.gae_id, ''))
            return
        old_user_id = user_model.id
        new_user_id = user_models.UserSettingsModel.get_new_id('')
        for model_class in models.Registry.get_all_storage_model_classes():
            if (model_class.get_user_id_migration_policy() ==
                    base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE):
                continue
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.COPY):
                output = UserIdMigrationJob._copy_model_with_new_id(
                    model_class, old_user_id, new_user_id)
                if output:
                    yield output
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.
                  COPY_AND_UPDATE_ONE_FIELD):
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
    def reduce(key, old_new_user_id_tuples):
        """Implements the reduce function for this job."""
        yield (key, old_new_user_id_tuples)


class SnapshotsUserIdMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for going through all the snapshot content models that can
    contain user ID and replacing it with new user ID.
    """

    @staticmethod
    def _replace_gae_ids(gae_ids):
        """Replace GAE IDs with user IDs in list.

        Args:
            gae_ids: list(str). GAE IDs which should be replaced.

        Returns:
            list(str). New user IDs.

        Raises:
            MissingUserException: UserSettingsModel with GAE ID doesn't exist.
        """
        new_ids = []
        for gae_id in gae_ids:
            if gae_id in feconf.SYSTEM_USERS:
                new_ids.append(gae_id)
            else:
                user_settings_model = (
                    user_models.UserSettingsModel.get_by_gae_id(gae_id))
                if not user_settings_model:
                    raise MissingUserException(gae_id)
                new_ids.append(user_settings_model.id)

        return new_ids

    @staticmethod
    def _migrate_collection(rights_snapshot_model):
        """Migrate CollectionRightsSnapshotContentModel to use the new user ID
        in the owner_ids, editor_ids, voice_artist_ids and viewer_ids.

        Args:
            rights_snapshot_model: CollectionRightsSnapshotContentModel.
                The model that contains the old user IDs.
        """
        content_dict = (
            collection_models.CollectionRightsModel.transform_dict_to_valid(
                rights_snapshot_model.content))
        reconstituted_rights_model = (
            collection_models.CollectionRightsModel(**content_dict))
        reconstituted_rights_model.owner_ids = (
            SnapshotsUserIdMigrationJob._replace_gae_ids(
                reconstituted_rights_model.owner_ids))
        reconstituted_rights_model.editor_ids = (
            SnapshotsUserIdMigrationJob._replace_gae_ids(
                reconstituted_rights_model.editor_ids))
        reconstituted_rights_model.voice_artist_ids = (
            SnapshotsUserIdMigrationJob._replace_gae_ids(
                reconstituted_rights_model.voice_artist_ids))
        reconstituted_rights_model.viewer_ids = (
            SnapshotsUserIdMigrationJob._replace_gae_ids(
                reconstituted_rights_model.viewer_ids))

        rights_snapshot_model.content = reconstituted_rights_model.to_dict()
        rights_snapshot_model.put(update_last_updated_time=False)

    @staticmethod
    def _migrate_exploration(rights_snapshot_model):
        """Migrate ExplorationRightsSnapshotContentModel to use the new user ID
        in the owner_ids, editor_ids, voice_artist_ids and viewer_ids.

        Args:
            rights_snapshot_model: ExplorationRightsSnapshotContentModel.
                The model that contains the old user IDs.
        """
        content_dict = (
            exp_models.ExplorationRightsModel.transform_dict_to_valid(
                rights_snapshot_model.content))
        reconstituted_rights_model = (
            exp_models.ExplorationRightsModel(**content_dict))

        reconstituted_rights_model.owner_ids = (
            SnapshotsUserIdMigrationJob._replace_gae_ids(
                reconstituted_rights_model.owner_ids))
        reconstituted_rights_model.editor_ids = (
            SnapshotsUserIdMigrationJob._replace_gae_ids(
                reconstituted_rights_model.editor_ids))
        reconstituted_rights_model.voice_artist_ids = (
            SnapshotsUserIdMigrationJob._replace_gae_ids(
                reconstituted_rights_model.voice_artist_ids))
        reconstituted_rights_model.viewer_ids = (
            SnapshotsUserIdMigrationJob._replace_gae_ids(
                reconstituted_rights_model.viewer_ids))

        rights_snapshot_model.content = reconstituted_rights_model.to_dict()
        rights_snapshot_model.put(update_last_updated_time=False)

    @staticmethod
    def _migrate_topic(rights_snapshot_model):
        """Migrate TopicRightsSnapshotContentModel to use the new user ID in
        the owner_ids, editor_ids, voice_artist_ids and viewer_ids.

        Args:
            rights_snapshot_model: TopicRightsSnapshotContentModel. The model
            that contains the old user IDs.
        """
        reconstituted_rights_model = topic_models.TopicRightsModel(
            **rights_snapshot_model.content)
        reconstituted_rights_model.manager_ids = (
            SnapshotsUserIdMigrationJob._replace_gae_ids(
                reconstituted_rights_model.manager_ids))
        rights_snapshot_model.content = reconstituted_rights_model.to_dict()
        rights_snapshot_model.put(update_last_updated_time=False)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [collection_models.CollectionRightsSnapshotContentModel,
                exp_models.ExplorationRightsSnapshotContentModel,
                topic_models.TopicRightsSnapshotContentModel]

    @staticmethod
    def map(rights_snapshot_model):
        """Implements the map function for this job."""
        class_name = rights_snapshot_model.__class__.__name__
        try:
            if isinstance(
                    rights_snapshot_model,
                    collection_models.CollectionRightsSnapshotContentModel):
                SnapshotsUserIdMigrationJob._migrate_collection(
                    rights_snapshot_model)
            elif isinstance(
                    rights_snapshot_model,
                    exp_models.ExplorationRightsSnapshotContentModel):
                SnapshotsUserIdMigrationJob._migrate_exploration(
                    rights_snapshot_model)
            elif isinstance(
                    rights_snapshot_model,
                    topic_models.TopicRightsSnapshotContentModel):
                SnapshotsUserIdMigrationJob._migrate_topic(
                    rights_snapshot_model)
        except MissingUserException as e:
            yield ('FAILURE - %s' % class_name, e)
        else:
            yield ('SUCCESS - %s' % class_name, rights_snapshot_model.id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        if key.startswith('SUCCESS'):
            yield (key, len(ids))
        else:
            yield (key, ids)


class GaeIdNotInModelsVerificationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for going through all the UserSettingsModels and checking
    that the gae_id is not mentioned in any of the fields that should contain
    user_id, this job also checks that all the new user IDs are 32 lowercase
    chars long strings.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_model):
        """Implements the map function for this job."""
        gae_id = user_model.gae_id
        if (len(user_model.id) != user_models.USER_ID_LENGTH or
                not all(c.islower() for c in user_model.id)):
            yield ('FAILURE - WRONG ID FORMAT', (gae_id, user_model.id))
        success = True
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
                yield ('FAILURE - HAS REFERENCE TO GAE ID',
                       (gae_id, model_class.__name__))
                success = False

        if success:
            yield ('SUCCESS', (gae_id, user_model.id))

    @staticmethod
    def reduce(key, status):
        """Implements the reduce function for this job."""
        yield (key, status)


class BaseModelsUserIdsHaveUserSettingsVerificationJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Base one-off job for going through the models that contain user IDs. This
    job checks that all the user IDs used in the model have their corresponding
    UserSettingsModel defined.
    """

    @staticmethod
    def _does_user_settings_model_exist(user_id):
        """Check if UserSettingsModel exists for the user_id or that the user_id
        belongs to one of SYSTEM_USERS.

        Args:
            user_id: str. User ID that should have its UserSettingsModel.

        Returns:
            True if UserSettingsModel with id equal to user_id exists, False
            otherwise.
        """
        if user_id in feconf.SYSTEM_USERS:
            return True
        return user_models.UserSettingsModel.get_by_id(user_id) is not None

    @staticmethod
    def _check_id_and_user_id_exist(model_id, user_id):
        """Check if UserSettingsModel exists for user_id and model id contains
        user_id or that the user_id belongs to one of SYSTEM_USERS.

        Args:
            model_id: str. ID of the model that should contain the user_id.
            user_id: str. User ID that should have its UserSettingsModel.

        Returns:
            True if UserSettingsModel with id as user_id in model exists or
            user_id belongs to one of SYSTEM_USERS. False otherwise.
        """
        if user_id not in model_id:
            return False
        if user_id in feconf.SYSTEM_USERS:
            return True
        return user_models.UserSettingsModel.get_by_id(user_id) is not None

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over.

        Raises:
            NotImplementedError: The method is not overwritten in derived
                classes.
        """
        raise NotImplementedError

    @staticmethod
    def map(model):
        """Implements the map function for this job."""
        model_class = model.__class__
        if (model_class.get_user_id_migration_policy() ==
                base_models.USER_ID_MIGRATION_POLICY.COPY):
            if (BaseModelsUserIdsHaveUserSettingsVerificationJob
                    ._does_user_settings_model_exist(model.id)):
                yield ('SUCCESS - %s' % model_class.__name__, model.id)
            else:
                yield ('FAILURE - %s' % model_class.__name__, model.id)
        elif (model_class.get_user_id_migration_policy() ==
              base_models.USER_ID_MIGRATION_POLICY.COPY_AND_UPDATE_ONE_FIELD):
            user_id = model.user_id
            if user_id is None:
                yield ('SUCCESS_NONE - %s' % model_class.__name__, model.id)
            elif (BaseModelsUserIdsHaveUserSettingsVerificationJob
                  ._check_id_and_user_id_exist(model.id, user_id)):
                yield ('SUCCESS - %s' % model_class.__name__, model.id)
            else:
                yield ('FAILURE - %s' % model_class.__name__, model.id)
        elif (model_class.get_user_id_migration_policy() ==
              base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD):
            # We need to get the name of the migration_field in order to
            # retrieve its value from the model.to_dict(). The migration_field
            # needs to be in the object format so that we are able to form
            # the model query easily
            # (in UserIdMigrationJob._change_model_with_one_user_id_field).
            user_id = model.to_dict()[
                model_class.get_user_id_migration_field()._name]  # pylint: disable=protected-access
            if user_id is None:
                yield ('SUCCESS_NONE - %s' % model_class.__name__, model.id)
            elif (BaseModelsUserIdsHaveUserSettingsVerificationJob
                  ._does_user_settings_model_exist(user_id)):
                yield ('SUCCESS - %s' % model_class.__name__, model.id)
            else:
                yield ('FAILURE - %s' % model_class.__name__, model.id)
        elif (model_class.get_user_id_migration_policy() ==
              base_models.USER_ID_MIGRATION_POLICY.CUSTOM):
            if model.verify_model_user_ids_exist():
                yield ('SUCCESS - %s' % model_class.__name__, model.id)
            else:
                yield ('FAILURE - %s' % model_class.__name__, model.id)

    @staticmethod
    def reduce(key, status):
        """Implements the reduce function for this job."""
        if key.startswith('SUCCESS'):
            yield (key, len(status))
        else:
            yield (key, status)


class ModelsUserIdsHaveUserSettingsVerificationJob(
        BaseModelsUserIdsHaveUserSettingsVerificationJob):
    """One-off job for going through all the models (except these listed in
    SEPARATE_MODEL_CLASSES) that contain user IDs. This job checks that all
    the user IDs used in the model have their corresponding UserSettingsModel
    defined.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We need to reduce the number of shards for this job, since it goes
        # over big number of model classes.
        super(ModelsUserIdsHaveUserSettingsVerificationJob, cls).enqueue(
            job_id, shard_count=2)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        model_classes = [model_class for model_class in
                         models.Registry.get_all_storage_model_classes()
                         if model_class.get_user_id_migration_policy() !=
                         base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE]
        return [model_class for model_class in model_classes if
                model_class not in SEPARATE_MODEL_CLASSES]


class ModelsUserIdsHaveUserSettingsExplorationsVerificationJob(
        BaseModelsUserIdsHaveUserSettingsVerificationJob):
    """One-off job for going through the models listed in SEPARATE_MODEL_CLASSES
    that contain user IDs. This job checks that all the user IDs used in
    the model have their corresponding UserSettingsModel defined.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return SEPARATE_MODEL_CLASSES
