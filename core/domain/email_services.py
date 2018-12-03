# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Service functions relating to email models."""

from core.domain import email_domain
from core.platform import models

(email_models,) = models.Registry.import_models([models.NAMES.email])


def get_general_feedback_reply_to_id_from_model(model):
    """Converts FeedbackEmailReplyToIdModel to a FeedbackEmailReplyToId.

    Args:
        model: FeedbackEmailReplyToIdModel. The model to be converted.

    Returns:
        FeedbackEmailReplyToId. The resulting domain object.
    """
    return email_domain.GeneralFeedbackEmailReplyToId(
        model.id, model.reply_to_id)


def get_general_feedback_reply_to_id(reply_to_id):
    """Gets the domain object corresponding to the model which is fetched by
    reply-to-id field.

    Args:
        reply_to_id: str. The reply_to_id to search for.

    Returns
        FeedbackEmailReplyToId or None. The corresponding domain object.
    """
    model = email_models.GeneralFeedbackEmailReplyToIdModel.get_by_reply_to_id(
        reply_to_id)
    if model is None:
        return None
    return get_general_feedback_reply_to_id_from_model(model)
