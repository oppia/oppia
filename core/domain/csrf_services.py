# coding: utf-8
#
# Domain object for CSRF secrets.

import datetime

from core.domain import domain_objects
from core.storage.user import gae_models as user_models
from utils import ValidationError

class CsrfSecret(domain_objects.BaseDomainObject):
    """Domain object for CSRF secrets."""

    def __init__(self, user_id, secret, created_on=None,
                 last_used_on=None, is_active=True):
        self.user_id = user_id
        self.secret = secret
        self.created_on = created_on
        self.last_used_on = last_used_on
        self.is_active = is_active

    def validate(self):
        if not isinstance(self.user_id, str) or not self.user_id.strip():
            raise ValidationError('user_id must be a non-empty string.')

        if not isinstance(self.secret, str) or not self.secret.strip():
            raise ValidationError('secret must be a non-empty string.')

        if len(self.secret) < 16:
            raise ValidationError('secret must be at least 16 characters long.')

        allowed_chars = set(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_="
        )
        if not set(self.secret) <= allowed_chars:
            raise ValidationError('secret contains invalid characters.')

        if self.created_on and self.created_on > datetime.datetime.utcnow():
            raise ValidationError('created_on cannot be in the future.')

        if self.last_used_on:
            if self.created_on and self.last_used_on < self.created_on:
                raise ValidationError(
                    'last_used_on cannot be earlier than created_on.'
                )

        if not isinstance(self.is_active, bool):
            raise ValidationError('is_active must be a boolean.')

    @classmethod
    def from_model(cls, model):
        """Creates domain object from storage model."""
        return cls(
            user_id=model.user_id,
            secret=model.secret,
            created_on=model.created_on,
            last_used_on=model.last_used_on,
            is_active=model.is_active
        )

    def to_model(self):
        """Converts domain object back to storage model."""
        return user_models.CsrfSecretModel(
            id=self.user_id,  # Use user_id as key.
            user_id=self.user_id,
            secret=self.secret,
            is_active=self.is_active,
            last_used_on=self.last_used_on
        )
