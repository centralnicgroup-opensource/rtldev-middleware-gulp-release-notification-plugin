## Notification for Teams Channel

### Prerequisites
To initiate a new notification for a Teams channel through a webhook, ensure you have the following environment variables set:

- `TEAMS_NOTIFICATION_URI`: The URI for the Teams channel webhook.
- `COMMIT_SHA` (optional): If desired, provide the Merge Commit SHA. This can be obtained from the GitHub workflow using `${{ github.sha }}` and should be passed in an environment variable named `COMMIT_SHA`.
- `GITHUB_TOKEN` (optional): If desired, provide the GITHUB TOKEN to fetch the pull request information.

### Additional Details
For more comprehensive information, including a Jira Issue link (via pull request information), ensure that the Merge Commit SHA is provided. This can be passed from the GitHub workflow using `${{ github.sha }}` and should also be set as an environment variable named `COMMIT_SHA`.
