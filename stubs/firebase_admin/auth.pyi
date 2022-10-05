from core.domain import auth_domain

import datetime
from typing import Any, Dict, List, Optional, Sequence, Union

from . import App


class UserRecord:
    def __init__(
            self, data: Dict[str, Any]
    ) -> None: ...

    @property
    def uid(self) -> str: ...

    @property
    def email(self) -> str: ...

    @property
    def custom_claims(self) -> Dict[str, str]: ...

    @property
    def disabled(self) -> bool: ...

class ImportUserRecord:
    @property
    def uid(self) -> str: ...

    @property
    def email(self) -> str: ...

    @property
    def custom_claims(self) -> Dict[str, str]: ...

    @property
    def disabled(self) -> bool: ...


class UserIdentifier: ...


class UidIdentifier(UserIdentifier):

    def __init__(self, uid: str): ...

    @property
    def uid(self) -> str: ...


class GetUsersResult:

    def __init__(
        self, users: Sequence[UserRecord], not_found: Sequence[UserIdentifier]
    ) -> None: ...

    @property
    def users(self) -> List[UserRecord]: ...

    @property
    def not_found(self) -> List[UserIdentifier]: ...


class UserImportResult:
    def __init__(
            self, result: Dict[str, Any], total: int
    ) -> None: ...


class ListUsersPage: ...


class BatchDeleteAccountsResponse:
    def __init__(
            self, errors: List[Dict[str, Union[int, str]]] = ...
    ) -> None: ...


def create_session_cookie(
        id_token: Optional[str],
        expires_in: Optional[datetime.timedelta],
        app: Optional[App] = ...
) -> str: ...


def create_user(**kwargs: Any) -> UserRecord: ...


def update_user(uid: str, **kwargs: Any) -> None: ...


def delete_user(uid: str) -> None: ...


def get_user(uid: str) -> UserRecord: ...


def get_users(uids: List[UserIdentifier]) -> GetUsersResult: ...


def set_custom_user_claims(
        uid: str,
        custom_claims: Optional[str],
        app: Optional[App] = ...
) -> None: ...


def revoke_refresh_tokens(
        uid: str, app: Optional[App] = ...
) -> None: ...


def verify_session_cookie(
        session_cookie: str,
        check_revoked: bool = ...,
        app: Optional[App] = ...
) -> auth_domain.AuthClaimsDict: ...


class UserNotFoundError(Exception): ...


class ExpiredSessionCookieError(Exception): ...


class RevokedSessionCookieError(Exception): ...


class InvalidIdTokenError(Exception): ...


class UidAlreadyExistsError(Exception): ...


class UserDisabledError(Exception): ...


class InternalError(Exception): ...
