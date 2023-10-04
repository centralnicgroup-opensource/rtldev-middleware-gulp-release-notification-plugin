const { series } = require('gulp');
const arg = require('./lib/arguments');
const { execSync, exec } = require('child_process');

async function publish() {
    const webHookURI = execSync("echo $RTLDEV_MW_NOTIFICATION_URI").toString().trim();
    if (!webHookURI || webHookURI.length === 0) {
        console.log(
            'Web Hook URI is not provided, please make sure you have exported variable RTLDEV_MW_NOTIFICATION_URI!',
        );
        return;
    }

    const notes = await generateNotes();
    if (!notes || notes.length === 0 || notes === 'undefined') {
        console.log(
            'Notes are not provided to publish a notification on Teams Channel!',
        );
        return;
    }

    const cmd = `curl -H 'Content-Type: application/json' -d '{
        "@context": "https://schema.org/extensions",
        "@type": "MessageCard",
        "themeColor": "0076D7",
        "text": "Reporter: Team Middleware [[Kai](https://github.com/KaiSchwarz-cnic), [Asif](https://github.com/AsifNawaz-cnic), [Sebastian](https://github.com/SebastianVassiliou-cnic)]\n\nArea: 3rd-party Software Integrations",
      "sections": [
          {
            "activityTitle": "Reasons",
            "activityText": "${notes}"
          }
        ]}' ${webHookURI}`;
    try {
        let res = execSync(cmd);
        if (res.toString() === '1') {
            console.log(
                'Notification published successfully on Teams Change Management Channel.',
            );
        }
    } catch (err) {
        console.error(err.stderr.toString());
        return;
    }
}

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

module.exports = series(publish);
