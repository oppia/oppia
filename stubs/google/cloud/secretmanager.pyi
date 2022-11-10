from google import auth
from typing import Dict

class SecretPayload:
    data: bytes

class AccessSecretVersionResponse:
    payload: SecretPayload

class SecretManagerServiceClient:

    def __init__(
        self,
        credentials: auth.credentials.Credentials = ...
    ):...

    def access_secret_version(
        self, request: Dict[str, str]
    ) -> AccessSecretVersionResponse: ...
