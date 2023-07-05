from typing import Any, Dict, Optional


class MailChimpClient(object):
    def __init__(
        self,
        mc_api: Optional[str] = None,
        mc_user: Optional[str] = 'python-mailchimp',
        access_token: Optional[str] = None,
        enabled: bool = True,
        timeout: Optional[float] = None,
        request_hooks: Optional[Dict[str, str]] = None,
        request_headers: Optional[Dict[str, Any]] = None
    ): ...


class MailChimpError(Exception): ...
