const arg = require('./arguments');
async function generateNotes() {
    // Decode the notes to handle any special characters.
    let cleanedNotes = decodeURIComponent(arg.notes);

    // Define the regex to match links and commit ids in the notes.
    const regex = /\(\[([^[\]]*)\]\([^()]*\)\)|\[([^[\]]*)\]\([^()]*\)/gi;

    // Replace the links and commit ids with the text in the square brackets.
    cleanedNotes = cleanedNotes.replace(regex, '$2');

    // Return the cleaned release notes.
    return cleanedNotes;
}
function getArguments(repoUrl) {
    let releaseType;
    switch (arg?.type) {
        case "minor":
            releaseType = "Feature Release:";
            break;
        case "major":
            releaseType = "Major Release:"
            break;
        default:
            releaseType = "Patch Release:";

    }
    let releaseUrl = false;
    let versionNumber = arg?.update ?? "Development Changes";
    if (/\d+\.\d+\.\d+/.test(versionNumber)) {
        releaseUrl = `${repoUrl}/releases/tag/v${versionNumber}`;
    }
    return { versionNumber: versionNumber, releaseType, releaseUrl }
}
module.exports = { generateNotes, getArguments };