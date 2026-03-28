# coding=utf-8
"""
The Campaigns API actions endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/campaigns/
Schema: https://api.mailchimp.com/schema/3.0/CampaignFolders/Instance.json
"""
from __future__ import unicode_literals

from datetime import timedelta

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_email


class CampaignActions(BaseApi):
    """
    Campaigns are how you send emails to your MailChimp list. Use the
    Campaigns API calls to manage campaigns in your MailChimp account.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(CampaignActions, self).__init__(*args, **kwargs)
        self.endpoint = 'campaigns'
        self.campaign_id = None


    # Pro feature
    def cancel(self, campaign_id):
        """
        Cancel a Regular or Plain-Text Campaign after you send, before all of
        your recipients receive it. This feature is included with MailChimp
        Pro.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        """
        self.campaign_id = campaign_id
        return self._mc_client._post(url=self._build_path(campaign_id, 'actions/cancel-send'))


    def pause(self, campaign_id):
        """
        Pause an RSS-Driven campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        """
        self.campaign_id = campaign_id
        return self._mc_client._post(url=self._build_path(campaign_id, 'actions/pause'))


    def replicate(self, campaign_id):
        """
        Replicate a campaign in saved or send status.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        """
        self.campaign_id = campaign_id
        return self._mc_client._post(url=self._build_path(campaign_id, 'actions/replicate'))


    def resume(self, campaign_id):
        """
        Resume an RSS-Driven campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        """
        self.campaign_id = campaign_id
        return self._mc_client._post(url=self._build_path(campaign_id, 'actions/resume'))


    def schedule(self, campaign_id, data):
        """
        Schedule a campaign for delivery. If you’re using Multivariate
        Campaigns to test send times or sending RSS Campaigns, use the send
        action instead.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "schedule_time": datetime* (A UTC timezone datetime that ends on the quarter hour [:00, :15, :30, or :45])
        }
        """
        if not data['schedule_time']:
            raise ValueError('You must supply a schedule_time')
        else:
            if data['schedule_time'].tzinfo is None:
                raise ValueError('The schedule_time must be in UTC')
            else:
                if data['schedule_time'].tzinfo.utcoffset(None) != timedelta(0):
                    raise ValueError('The schedule_time must be in UTC')
        if data['schedule_time'].minute not in [0, 15, 30, 45]:
            raise ValueError('The schedule_time must end on the quarter hour (00, 15, 30, 45)')
        data['schedule_time'] = data['schedule_time'].strftime('%Y-%m-%dT%H:%M:00+00:00')
        self.campaign_id = campaign_id
        return self._mc_client._post(url=self._build_path(campaign_id, 'actions/schedule'), data=data)


    def send(self, campaign_id):
        """
        Send a MailChimp campaign. For RSS Campaigns, the campaign will send
        according to its schedule. All other campaigns will send immediately.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        """
        self.campaign_id = campaign_id
        return self._mc_client._post(url=self._build_path(campaign_id, 'actions/send'))


    def resend(self, campaign_id):
        """
        Creates a Resend to Non-Openers version of this campaign. We will also
        check if this campaign meets the criteria for Resend to Non-Openers
        campaigns.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        """
        self.campaign_id = campaign_id
        return self._mc_client._post(url=self._build_path(campaign_id, 'actions/create-resend'))


    def test(self, campaign_id, data):
        """
        Send a test email.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "test_emails": array*,
            "send_type": string* (Must be one of "html" or "plaintext")
        }
        """
        for email in data['test_emails']:
            check_email(email)
        if data['send_type'] not in ['html', 'plaintext']:
            raise ValueError('The send_type must be either "html" or "plaintext"')
        self.campaign_id = campaign_id
        return self._mc_client._post(url=self._build_path(campaign_id, 'actions/test'), data=data)


    def unschedule(self, campaign_id):
        """
        Unschedule a scheduled campaign that hasn’t started sending.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        """
        self.campaign_id = campaign_id
        return self._mc_client._post(url=self._build_path(campaign_id, 'actions/unschedule'))
