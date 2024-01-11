const fs = require('fs').promises;
const { execSync } = require('child_process');

// Function to update values based on matching key-value pairs
const updateValues = (payload, customValues) => {
    if (typeof payload === 'object') {
        for (const prop in payload) {
            updateValues(payload[prop], customValues);

            const matchingFind = customValues.find(({ find }) => isObjectMatch(payload[prop], find));

            if (matchingFind) {
                const { replace } = matchingFind;

                for (const replaceKey in replace) {
                    if (replace[replaceKey] === "") {
                        delete payload[prop];
                    } else if (payload[prop][replaceKey] !== undefined) {
                        payload[prop][replaceKey] = replace[replaceKey];
                    } else {
                        findAndReplaceNestedKey(payload[prop], replaceKey, replace[replaceKey]);
                    }
                }
            }
        }
        payload = removeNulls(payload);
    }
};

// Helper function to find and replace a nested key dynamically
const findAndReplaceNestedKey = (obj, targetKey, replacement) => {
    for (const key in obj) {
        if (typeof obj[key] === 'object') {
            findAndReplaceNestedKey(obj[key], targetKey, replacement);
        } else if (key === targetKey) {
            obj[key] = replacement;
        }
    }
};

// Helper function to check if two objects match
const isObjectMatch = (obj, criteria) =>
    Object.entries(criteria).every(([key, value]) => obj && obj.hasOwnProperty(key) && obj[key] === value);

const readPackageJson = async () => {
    try {
        const { repository, name } = JSON.parse(await fs.readFile('package.json', 'utf8'));

        const [prefix, repo] = repository?.split(':') || [];
        let repoUrl;
        if (prefix === 'github' && repo) {
            // Check if the repository name ends with '.git' and remove it
            const sanitizedRepo = repo.endsWith('.git') ? repo.slice(0, -4) : repo;

            // Construct the GitHub URL
            repoUrl = `https://github.com/${sanitizedRepo}`;
        } else {
            // Handle the case of an invalid GitHub string format
            console.error('Invalid GitHub string format. Please provide a valid GitHub repository string in the format "github:username/repo.git".');

            // Optionally, set repoUrl to a default value or handle the error accordingly
            repoUrl = undefined;
        }
        return { projectName: name || "", repoUrl };
    } catch (error) {
        console.error('Error reading or parsing package.json file:', error);
    }
};

const retryFn = async (payload = {}) => {
    if (retryFn.counter > 3) {
        return;
    }
    retryFn.counter++;
    console.log("Waiting 5 seconds to retry publishing the notification.");
    await new Promise(res => setTimeout(res, 5000));
    await publishNotification(payload);
}
retryFn.counter = 1;

const fetchPullRequestInfo = (repoUrl) => {
    const usernameAndRepo = repoUrl.split('/').slice(-2).join('/');
    const commitSHA = execSync("echo $COMMIT_SHA").toString().trim();
    const githubToken = execSync("echo ${RTLDEV_MW_CI_TOKEN:-${GH_TOKEN:-$GITHUB_TOKEN}}").toString().trim();

    if (!githubToken || !commitSHA || !usernameAndRepo) {
        return;
    }

    try {
        const result = JSON.parse(execSync(`curl -s -L -H "Accept: application/vnd.github+json" -H "Authorization: Bearer ${githubToken}" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/${usernameAndRepo}/commits/${commitSHA}/pulls`, { encoding: 'utf-8' }))[0];

        if (result?.title || result?.head?.ref) {
            const jiraID = result?.title.match(/(RSRMID|GI)-\d+/g) || result?.head?.ref.match(/(RSRMID|GI)-\d+/g);
            return jiraID ? `https://centralnic.atlassian.net/browse/${jiraID}` : "";
        }
        return;
    } catch (error) {
        console.error(error.toString());
        return;
    }
}

const publishNotification = async (payload) => {
    const webhookUrl = execSync("echo $TEAMS_NOTIFICATION_URI").toString().trim();
    try {
        const res = execSync(`curl -sS -X POST -H "Content-Type: application/json" -d  '${JSON.stringify(payload)}' '${webhookUrl}'`, { encoding: 'utf-8' });
        if (res.toString() === '1') {
            console.log(
                'Notification published successfully on Teams Change Management Channel.',
            );
            return;
        }
        console.error(res.toString());
        await retryFn(payload);
    } catch (err) {
        await retryFn(payload);
        console.error(err.stderr.toString());
        return;
    }
}

const removeNulls = (obj) => {
    if (obj && typeof obj === "object") {
        if (Array.isArray(obj)) {
            // Remove null entries from arrays
            obj = obj.filter(item => item !== null);
        } else {
            // Remove null entries from objects
            for (const key in obj) {
                if (obj[key] === null) {
                    delete obj[key];
                } else {
                    obj[key] = removeNulls(obj[key]);
                }
            }
        }
    }
    return obj;
}

module.exports = { updateValues, isObjectMatch, findAndReplaceNestedKey, readPackageJson, retryFn, fetchPullRequestInfo, publishNotification };
