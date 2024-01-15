const arg = require('./arguments');
function getNotes() {
    // Decode the notes to handle any special characters.
    let cleanedNotes = decodeURIComponent(arg.notes);

    // Define the regex to match links and commit ids in the notes.
    const regex = /\*\*([^:]+):\*\* (.*) \(\[([a-f0-9]{7})\]\(.*?\)\)/g; // match the commit data with category and message
    const result = cleanedNotes.match(regex); // extract the commit data as an array
    if (result?.length) {
        cleanedNotes = "";
        result.forEach(item => {
            item = item.replace(/\(\[([a-f0-9]{7})\]\(.*?\)\)/, ''); // remove the parentheses and the commit hash
            item = item.trim(); // remove any extra spaces
            cleanedNotes += item + '\n\n'; // add the formatted item to the output string with a line break
        });
    }

    // Return the cleaned release notes.
    return `Changelog:\n\n${cleanedNotes}`;
}

function getReleaseDate() {
    const cleanedNotes = decodeURIComponent(arg.notes);
    const regex = /\(\d{4}-\d{2}-\d{2}\)/; // Match the date in parentheses
    const result = cleanedNotes.match(regex); // Extract the date as a string

    return result?.length ? `(${result[0].replace(/\(|\)/g, '')})` : ""; // Remove the parentheses and return the date
}

function getArguments(repoUrl) {
    let releaseType;
    let headerColor;
    switch (arg?.type) {
        case "minor":
            releaseType = "Feature Release:";
            headerColor = "accent";
            break;
        case "major":
            releaseType = "Major Release:"
            headerColor = "good";
            break;
        default:
            releaseType = "Patch Release:";
            headerColor = "attention";
    }
    let releaseUrl = "";
    const versionNumber = arg?.update ?? "Development Changes";
    const hasModule = arg?.module ?? "";
    if (!/tpp|ibs/i.test(hasModule) && /\d+\.\d+\.\d+/.test(versionNumber)) {
        releaseUrl = `${repoUrl}/releases/tag/v${versionNumber}`;
    }
    let repoImg = "";
    if (/whmcs-src|blesta/i.test(repoUrl)) {
        repoImg = `https://github.com/centralnicgroup-opensource/rtldev-middleware-gulp-release-notification-plugin/blob/main/assets/${repoUrl.split('/').slice(-1)}.png?raw=true`;
    }
    return { versionNumber: versionNumber, releaseType, releaseUrl, headerColor, repoImg }
}

module.exports = { getNotes, getArguments, getReleaseDate };