const download = require('download');
const request = require('./utils');

const fs = require("fs-extra");
const path = require("path")
const fetch = require("node-fetch");

const {
    ipcRenderer,
    remote
} = require('electron')
let win = remote.getCurrentWindow()

let bar = document.getElementById("progress")
let job = document.getElementById("job")
const lang = {
    natives: "Downloading natives...",
    classes: "Downloading classes...",
    assets: "Downloading assets...",
    modpack: "Downloading modpack...",
    forge: "Downloading forge...",
}

const {
    Client,
    Authenticator
} = require("minecraft-launcher-core");
const launcher = new Client();

// Set user text
const user = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../", "user_cache.json")))
job.innerText = `Logged in as: ${user.selectedProfile.name}`


async function downloadModpack() {
    await download("https://codeload.github.com/breadfish18/sanctuary-modpack/zip/master", path.join(__dirname, "../../../"), {
        extract: true,
        headers: {
            "Access-Control-Allow-Headers": "Content-Length"
        }
    }).on('response', res => {
        job.innerText = lang["modpack"]
        console.log(res)
        bar.max = +res.headers['content-length']
        res.on('data', data => bar.value = bar.value + data.length);
    }).catch(e => console.log(e))
    fs.copySync(path.join(__dirname, "../../../", "./sanctuary-modpack-master"), path.join(__dirname, "../../../", "./minecraft"))
    fs.removeSync(path.join(__dirname, "../../../", "./sanctuary-modpack-master"))
    await download("https://files.minecraftforge.net/maven/net/minecraftforge/forge/1.12.2-14.23.5.2838/forge-1.12.2-14.23.5.2838-universal.jar", path.join(__dirname, "../../../"), {
        filename: "forge.jar"
    }).on('response', res => {
        job.innerText = lang["forge"]
        bar.max = +res.headers['content-length']
        res.on('data', data => bar.value = bar.value + data.length);

        console.log(res)
    }).catch(e => console.log(e))
}



async function play() {
    if (!fs.existsSync(path.join(__dirname, "../../../", "./minecraft/version.json"))) await downloadModpack()

    const remoteVersion = await fetch("https://raw.githubusercontent.com/MayaFX/sanctuary-modpack/master/version.json").then(res => res.json()).catch(e => console.log(e))
    const version = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../", "./minecraft/version.json")))

    if (!remoteVersion) console.log(e)
    if (remoteVersion.id > version.id) {
        await fs.remove(path.join(__dirname, "../../../", "./minecraft/mods"));
        await fs.remove(path.join(__dirname, "../../../", "./minecraft/config"));
        await fs.remove(path.join(__dirname, "../../../", "./minecraft/resources"));
        await fs.remove(path.join(__dirname, "../../../", "./minecraft/version.json"));
        await downloadModpack()
    }
    const auth = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../", "user_cache.json")))
    // console.log(Authenticator.refreshAuth(auth.accessToken, auth.clientToken, auth.selected_profile))
    const body = await request("https://authserver.mojang.com/refresh", {
        json: {
            "agent": {
                "name": "Minecraft",
                "version": 1
            },
            "accessToken": auth.accessToken,
            "clientToken": auth.clientToken,
        }
    }).catch(e => console.error(e))
    if (!body || !body.selectedProfile) return
    fs.writeFileSync(path.join(__dirname, "../../../", "user_cache.json"), JSON.stringify(body))
    const creds = {
        access_token: body.accessToken,
        client_token: body.clientToken,
        uuid: body.selectedProfile.id,
        name: body.selectedProfile.name,
        selected_profile: body.selectedProfile
    }
    let opts = {
        clientPackage: null,
        authorization: creds,
        root: "./minecraft",
        os: "windows",
        forge: "forge.jar",
        version: {
            number: "1.12.2",
            type: "release"
        },
        memory: {
            max: "4000",
            min: "2000"
        }
    }

    launcher.launch(opts);
    ipcRenderer.sendSync("status", "launching")

    launcher.on("debug", (e) => console.log(e));
    launcher.on("data", (e) => {
        if (e.includes('[Client thread/INFO] [FML]: Forge Mod Loader has successfully loaded')) {
            ipcRenderer.sendSync("status", "loaded")
        }
    });
    launcher.on("close", (e) => {
        ipcRenderer.sendSync("status", "exit")
    })
    launcher.on("progress", (e) => {
        bar.max = e.total;
        bar.value = e.task;
        job.innerText = lang[e.type];
    })

}