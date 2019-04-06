# coding: utf-8
#
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

"""One-off jobs for validating prod models."""
from core import jobs
from core.platform import models

(
    user_models, exp_models, collection_models,
    feedback_models) = models.Registry.import_models([
        models.NAMES.user, models.NAMES.exploration,
        models.NAMES.collection, models.NAMES.feedback])


def has_model_for_id(model_class, model_id):
    """Checks there's an existing nondeleted model for given model_id.

    Args:
        model_class: BaseModel. Class of the model.
        model_id: str. Key of the model.

    Returns:
        bool. True if there exists a model with given model_id.
        """
    model = model_class.get_by_id(model_id)
    return model is not None and model.deleted is False


class UserSubscriptionsModelValidator(object):
    """Class for validating UserSubscriptionModels."""

    errors = []

    @classmethod
    def validate(cls, item):
        """Validates a UserSubscriptionsModel entity.

        Args:
            item: UserSubscriptionsModel. Entity to validate.

        Returns:
            string. Validation status.
        """
        # For each key, checks the entries in that field of
        # UserSubscriptionsModel should be valid non-deleted instances of the
        # given model classes.
        external_ids_checks = {
            'activity_ids': exp_models.ExplorationModel,
            'collection_ids': collection_models.CollectionModel,
            'general_feedback_thread_ids': (
                feedback_models.GeneralFeedbackThreadModel),
            'creator_ids': user_models.UserSettingsModel,
        }
        if not has_model_for_id(user_models.UserSettingsModel, item.id):
            cls.errors.append(
                'id %s is not valid %s' % (
                    item.id,
                    user_models.UserSettingsModel.__name__))
        cls._check_external_ids(item, external_ids_checks=external_ids_checks)

    @classmethod
    def _check_external_ids(cls, item, **kwargs):
        """Check whether the external id properties on the model correspond
        to valid instances.
        """
        external_ids_checks = kwargs.get('external_ids_checks', {})
        for prop_name, model_class in external_ids_checks.iteritems():
            model_ids = getattr(item, prop_name)
            if not model_ids:
                continue
            for model_id in model_ids:
                if not has_model_for_id(model_class, model_id):
                    cls.errors.append(
                        'UserSubscriptionsModel id %s: based on field %s having'
                        ' value %s, expect model %s with id %s but it doesn\'t'
                        ' exist' % (
                            item.id, prop_name, model_id,
                            str(model_class.__name__), model_id))


class ProdValidationAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that audits and validates production models."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSubscriptionsModel]

    @staticmethod
    def map(model_instance):
        if not model_instance.deleted:
            if isinstance(model_instance, user_models.UserSubscriptionsModel):
                validate_user_subs_model = UserSubscriptionsModelValidator()
                validate_user_subs_model.validate(model_instance)
                if len(validate_user_subs_model.errors) > 0:
                    yield (
                        'user_subscription_model checks failed',
                        validate_user_subs_model.errors)
                else:
                    yield (
                        'user_subscription_model checks passed', 1)

    @staticmethod
    def reduce(key, values):
        if key == 'user_subscription_model checks passed':
            yield (key, len(values))
        else:
            yield (key, values)
