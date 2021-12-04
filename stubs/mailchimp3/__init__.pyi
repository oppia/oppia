from typing import Any, Dict, Optional

class MailChimp(object):
    lists: Lists = ...

class Lists:
    members: ListMembers = ...

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
