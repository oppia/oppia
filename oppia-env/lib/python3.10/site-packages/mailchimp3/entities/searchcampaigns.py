# coding=utf-8
"""
The Search Members API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/search-campaigns/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Members/Collection.json
Additional Data: http://kb.mailchimp.com/accounts/management/search-for-subscribers-and-campaigns-in-your-account
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class SearchCampaigns(BaseApi):
    """
    Search all of an account’s campaigns for the specified query terms.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(SearchCampaigns, self).__init__(*args, **kwargs)
        self.endpoint = 'search-campaigns'


    def get(self, **queryparams):
        """
        Search all campaigns for the specified query terms.

        :param queryparams: The query string parameters
        queryparams['fields'] = array
        queryparams['exclude_fields'] = array
        queryparams['query'] = string
        queryparams['snip_start'] = string
        queryparams['snip_end'] = string
        queryparams['offset'] = integer
        """
        return self._mc_client._get(url=self._build_path(), **queryparams)
