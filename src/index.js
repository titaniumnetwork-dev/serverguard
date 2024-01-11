import express from "express";

const app = express();
const port = 3113;
let ip;

app.get("/", async (req, res) => {
    ip = '198.98.51.189';
    const query = await fetch(`https://proxycheck.io/v2/${ip}&short=1&vpn=3`);
    const data = await query.json();
    console.log(data);
    if (data.proxy === "yes" || data.vpn === "yes" || data.type === "TOR") {
        res.send("flagged");
    }
    else {
        res.send("passed");
    }

});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});