from typing import Dict

class SecretPayload:
    data: bytes

class Secret:
    payload: SecretPayload

class SecretManagerServiceClient:

    def get_secret(self, request: Dict[str, str]) -> Secret: ...
