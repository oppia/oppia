from core.domain import base_domain
from core import utils


class CsrfSecret(base_domain.BaseDomainObject):

    def __init__(self, oppia_csrf_secret):
        self.oppia_csrf_secret = oppia_csrf_secret

    def validate(self):
        if not isinstance(self.oppia_csrf_secret, str):
            raise utils.ValidationError("Must be string")

        if self.oppia_csrf_secret == "":
            raise utils.ValidationError("Cannot be empty")