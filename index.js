const { series } = require('gulp');
const arg = require('./lib/arguments');
const { execSync } = require('child_process');

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

    const cmd = `curl -sS --no-progress-bar -H 'Content-Type: application/json' -d '{
        "@context": "https://schema.org/extensions",
        "@type": "MessageCard",
        "themeColor": "0076D7",
        "text": "Reporter: Team Middleware [[Kai](https://github.com/KaiSchwarz-cnic), [Asif](https://github.com/AsifNawaz-cnic), [Sebastian](https://github.com/SebastianVassiliou-cnic)]\n\nArea: 3rd-party Software Integrations",
      "sections": [
          {
            "activityTitle": "Reason:",
            "activityText": "${notes}"
          }
        ]}' 'https://centralnic.webhook.office.com/webhookb2/c295524b-ddc6-480d-b7af-bc1d0bb7ce6d@b4f6acc5-a1a2-441f-ab33-4584863ff079/IncomingWebhook/f26b299d529a4f838c45c2e28312ef07/5dc662cd-7b04-481a-8e6c'`;
    try {
        let res = execSync(cmd, { encoding: 'utf8' });
        if (res.toString() === '1') {
            console.log(
                'Notification published successfully on Teams Change Management Channel.',
            );
            return;
        }
        console.error(res.toString());
        await retryFn();
    } catch (err) {
        await retryFn();
        console.error(err.stderr.toString());
        return;
    }
}

async function retryFn() {
    if (retryFn.counter > 3) {
        return;
    }
    retryFn.counter++;
    console.log("Waiting 5 seconds to retry publishing the notification.");
    await new Promise(res => setTimeout(res, 5000));
    await publish();
}
retryFn.counter = 1;

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
