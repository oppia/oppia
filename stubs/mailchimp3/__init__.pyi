from .mailchimpclient import MailChimpClient as MailChimpClient

from typing import Any, Dict, List, Optional, TypedDict


class ListsDataDict(TypedDict):
    members: List[Dict[str, str]]
    update_existing: bool


class MailChimp(MailChimpClient):
    lists: Lists = ...


class Lists:
    members: ListMembers = ...
    def update_members(
        self,
        list_id: Optional[str],
        data: ListsDataDict
    ) -> Dict[str, Any]: ...


class ListMembers:
    def create(
            self,
            list_id: Optional[str],
            data: Dict[str, str]
    ) -> Dict[str, Any]: ...

    def get(
            self,
            list_id: Optional[str],
            subscriber_hash: str,
            **queryparams: Any
    ) -> Dict[str, Any]: ...

    def update(
            self,
            list_id: Optional[str],
            subscriber_hash: str,
            data: Dict[str, Any]
    ) -> Dict[str, Any]: ...

    def delete_permanent(
            self,
            list_id: Optional[str],
            subscriber_hash: str,
    ) -> Dict[str, Any]: ...
