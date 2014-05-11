var Youtube = require("../index");

Youtube.authenticate({
    type: "oauth",
    token: "ya29.1.AADtN_VnoQp731rlzX2KWVUX3E2KphZSsPS-1RTJupAEdeVXisRQZBIXMBVKhmgCPX2Z2Q"
});

Youtube.subscriptions.delete({
    id: "HRSuU1t0gyIhzEKunJU0JrZnwF9v5MFXcsYqvI0qDao"
}, function (err, data) {
    if (err) {
        console.log("Error: ", err);
    } else {
        console.log("Data: ", data);
    }
});
