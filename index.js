const { getArguments } = require('./lib/notes');
const { updateValues, readPackageJson, publishNotification, fetchPullRequestInfo } = require('./lib/payloadUtils');
const messagePayload = require('./lib/teams_payload.json');

// Main function that returns a promise
async function postNotification() {
    // Read package.json to get project details
    const { projectName, repoUrl } = await readPackageJson();
    // Fetch Jira issue link based on the repository URL
    const jiraIssueLink = fetchPullRequestInfo(repoUrl);
    // Get version information and release details
    const { versionNumber, releaseType, releaseUrl } = getArguments(repoUrl);
    // Function to create a custom value object with 'find' and 'replace' keys
    const createCustomValue = (find, replace) => ({ find, replace });

    // Array to store custom values based on project and release information
    const customValues = [
        // Create custom value for the project name
        createCustomValue({ name: "Project:" }, { value: projectName }),
        // Create custom value for the release type and version number also replace the name
        createCustomValue({ name: "Release Type:" }, { name: releaseType, value: versionNumber }),
        // Add Release Notes custom value if releaseUrl is provided
        releaseUrl && createCustomValue({ name: "Release Notes" }, { uri: releaseUrl }),
        // Add Github Repository custom value if repoUrl is provided
        repoUrl && createCustomValue({ name: "Github Repository" }, { uri: repoUrl }),
        // Add Jira Issue custom value if jiraIssueLink is provided
        jiraIssueLink && createCustomValue({ name: "Jira Issue" }, { uri: jiraIssueLink }),
    ].filter(Boolean);  // Remove any falsy values from the array (e.g., if releaseUrl, repoUrl, or jiraIssueLink is not provided)


    // Override values of the messagePayload directly based on customValues
    if (Object.keys(customValues).length !== 0) {
        updateValues(messagePayload, customValues);
    }

    return await publishNotification(messagePayload);
};

module.exports = postNotification;