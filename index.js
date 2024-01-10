const { getArguments, getNotes, getReleaseDate } = require('./lib/notes');
const { updateValues, readPackageJson, publishNotification, fetchPullRequestInfo } = require('./lib/payloadUtils');
const { execSync } = require('child_process');

// Main function that returns a promise
async function postNotification() {
    // Read package.json to get project details
    const { projectName, repoUrl } = await readPackageJson();
    // Fetch Jira issue link based on the repository URL
    const jiraIssueLink = fetchPullRequestInfo(repoUrl);
    // Get version information and release details
    const { versionNumber, releaseType, releaseUrl, headerColor, repoImg } = getArguments(repoUrl);

    const notificationType = execSync("echo $TEAMS_NOTIFICATION_TYPE").toString().trim();
    const messagePayload = require(notificationType ? './lib/messagecard_payload.json' : './lib/default_payload.json');

    // Function to create a custom value object with 'find' and 'replace' keys
    const createCustomValue = (find, replace) => ({ find, replace });

    const customValues = [];
    const pushCustomValue = (nameKey, titleKey) => (label, value) => {
        const key = notificationType ? nameKey : titleKey;
        customValues.push(createCustomValue({ [key]: label }, value));
    };

    const pushValue = pushCustomValue("name", "id");

    if (!notificationType) {
        pushValue("projectName", { text: projectName });
        pushValue("releaseInfo", { text: `${releaseType} v${versionNumber} ${getReleaseDate()}` });
        pushValue("changeLog", { text: getNotes() });
        pushValue("header", { style: headerColor });
        pushValue("releaseNotes", { url: releaseUrl ?? "" });
        pushValue("githubRepository", { url: repoUrl ?? "" });
        pushValue("jiraIssue", { url: jiraIssueLink ?? "" });
        pushValue("productImage", { url: repoImg ?? "" });
    } else {
        pushValue("Project:", { value: projectName });
        pushValue("Release Type:", { "title": releaseType, value: versionNumber });
        pushValue("Release Notes", { uri: releaseUrl ?? "" });
        pushValue("Github Repository", { uri: repoUrl ?? "" });
        pushValue("Jira Issue", { uri: jiraIssueLink ?? "" });
    }

    // Override values of the messagePayload directly based on customValues
    if (Object.keys(customValues).length !== 0) {
        updateValues(messagePayload, customValues);
    }

    return await publishNotification(messagePayload);
};

module.exports = postNotification;