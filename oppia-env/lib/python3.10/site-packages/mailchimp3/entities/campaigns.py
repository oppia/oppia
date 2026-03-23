# coding=utf-8
"""
The Campaigns API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/campaigns/
Schema: https://api.mailchimp.com/schema/3.0/Campaigns/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.campaignactions import CampaignActions
from mailchimp3.entities.campaigncontent import CampaignContent
from mailchimp3.entities.campaignfeedback import CampaignFeedback
from mailchimp3.entities.campaignsendchecklist import CampaignSendChecklist
from mailchimp3.helpers import check_email


class Campaigns(BaseApi):
    """
    Campaigns are how you send emails to your MailChimp list. Use the
    Campaigns API calls to manage campaigns in your MailChimp account.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(Campaigns, self).__init__(*args, **kwargs)
        self.endpoint = 'campaigns'
        self.campaign_id = None
        self.actions = CampaignActions(self)
        self.content = CampaignContent(self)
        self.feedback = CampaignFeedback(self)
        self.send_checklist = CampaignSendChecklist(self)


    def create(self, data):
        """
        Create a new MailChimp campaign.

        The ValueError raised by an invalid type in data does not mention
        'absplit' as a potential value because the documentation indicates
        that the absplit type has been deprecated.

        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "recipients": object*
            {
                "list_id": string*
            },
            "variate_settings": object* (Required if type is "variate")
            {
                "subject_lines": string* (can be empty if subject_line in settings)
                "from_names": string* (can be empty if from_name in settings)
                "reply_to_addresses": string* (can be empty if reply_to in settings)
                "winner_criteria": string* (Must be one of "opens", "clicks", "total_revenue", or "manual")
            },
            "rss_opts": object* (Required if type is "rss")
            {
                "feed_url": string*,
                "frequency": string* (Must be one of "daily", "weekly", or "monthly")
            },
            "type": string* (Must be one of "regular", "plaintext", "rss", "variate", or "absplit")
        }
        """
        if 'recipients' not in data:
            raise KeyError('The campaign must have recipients')
        if 'list_id' not in data['recipients']:
            raise KeyError('The campaign recipients must have a list_id')
        if 'reply_to' in data.get('settings', {}):
            check_email(data['settings']['reply_to'])
        if 'type' not in data:
            raise KeyError('The campaign must have a type')
        if not data['type'] in ['regular', 'plaintext', 'rss', 'variate', 'abspilt']:
            raise ValueError('The campaign type must be one of "regular", "plaintext", "rss", or "variate"')
        if data['type'] == 'variate':
            if 'variate_settings' not in data:
                raise KeyError('The variate campaign must have variate_settings')
            if 'winner_criteria' not in data['variate_settings']:
                raise KeyError('The campaign variate_settings must have a winner_criteria')
            if data['variate_settings']['winner_criteria'] not in ['opens', 'clicks', 'total_revenue', 'manual']:
                raise ValueError('The campaign variate_settings '
                                 'winner_criteria must be one of "opens", "clicks", "total_revenue", or "manual"')
            if 'subject_lines' not in data['variate_settings'] and 'subject_line' not in data.get('settings'):
                raise KeyError('The campaign variate_settings must have a subject_lines')
            if 'from_names' not in data['variate_settings'] and 'from_name' not in data.get('settings'):
                raise KeyError('The campaign variate_settings must have a from_names')
            if 'reply_to_addresses' not in data['variate_settings'] and 'reply_to' not in data.get('settings'):
                raise KeyError('The campaign variate_settings must have a reply_to_addresses')
        if data['type'] == 'rss':
            if 'rss_opts' not in data:
                raise KeyError('The rss campaign must have rss_opts')
            if 'feed_url' not in data['rss_opts']:
                raise KeyError('The campaign rss_opts must have a feed_url')
            if not data['rss_opts']['frequency'] in ['daily', 'weekly', 'monthly']:
                raise ValueError('The rss_opts frequency must be one of "daily", "weekly", or "monthly"')
        response = self._mc_client._post(url=self._build_path(), data=data)
        if response is not None:
            self.campaign_id = response['id']
        else:
            self.campaign_id = None
        return response


    def all(self, get_all=False, **queryparams):
        """
        Get all campaigns in an account.

        .. note::
            The before_create_time, since_create_time, before_send_time, and
            since_send_time queryparams expect times to be listed in the ISO
            8601 format in UTC (ex. 2015-10-21T15:41:36+00:00).

        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['type'] = []
        queryparams['status'] = []
        queryparams['before_send_time'] = string
        queryparams['since_send_time'] = string
        queryparams['before_create_time'] = string
        queryparams['since_create_time'] = string
        queryparams['list_id'] = string
        queryparams['folder_id'] = string
        queryparams['sort_field'] = string
        queryparams['sort_dir'] = string
        """
        self.campaign_id = None
        if get_all:
            return self._iterate(url=self._build_path(), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(), **queryparams)


    def get(self, campaign_id, **queryparams):
        """
        Get information about a specific campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['sort_field'] = string
        queryparams['create_time'] = string
        """
        self.campaign_id = campaign_id
        return self._mc_client._get(url=self._build_path(campaign_id), **queryparams)


    def update(self, campaign_id, data):
        """
        Update some or all of the settings for a specific campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "settings": object*
            {
                "subject_line": string*,
                "from_name": string*,
                "reply_to": string*
            },
        }
        """
        self.campaign_id = campaign_id
        if 'settings' not in data:
            raise KeyError('The campaign must have settings')
        if 'subject_line' not in data['settings']:
            raise KeyError('The campaign settings must have a subject_line')
        if 'from_name' not in data['settings']:
            raise KeyError('The campaign settings must have a from_name')
        if 'reply_to' not in data['settings']:
            raise KeyError('The campaign settings must have a reply_to')
        check_email(data['settings']['reply_to'])
        return self._mc_client._patch(url=self._build_path(campaign_id), data=data)


    def delete(self, campaign_id):
        """
        Remove a campaign from your MailChimp account.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        """
        self.campaign_id = campaign_id
        return self._mc_client._delete(url=self._build_path(campaign_id))
