from typing import Dict

class SecretPayload:
    data: bytes

class AccessSecretVersionResponse:
    payload: SecretPayload

class SecretManagerServiceClient:

    def access_secret_version(
        self, request: Dict[str, str]
    ) -> AccessSecretVersionResponse: ...
