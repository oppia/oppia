from typing import Any, Dict, Optional, Text

class MailChimp(object):
    lists: Lists = ...

class Lists:
    members: ListMembers = ...

class ListMembers:
    def create(
            self,
            list_id: Optional[Text],
            data: Dict[Text, Any]
    ) -> Dict[Text, Any]: ...

    def get(
            self,
            list_id: Optional[Text],
            subscriber_hash: Text,
            **queryparams: Any
    ) -> Dict[Text, Any]: ...

    def update(
            self,
            list_id: Optional[Text],
            subscriber_hash: Text,
            data: Dict[Text, Any]
    ) -> Dict[Text, Any]: ...

    def delete_permanent(
            self,
            list_id: Optional[Text],
            subscriber_hash: Text,
    ) -> Dict[Text, Any]: ...
