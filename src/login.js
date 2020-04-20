const {
    remote
} = require('electron')
const {
    Authenticator
} = require('minecraft-launcher-core');
const uuid = require('uuid/v1');
const fs = require('fs');
const path = require("path")
const request = require("./utils")

const login_button = document.getElementById('login_button')
const email = document.getElementById('email')
const password = document.getElementById('password')

async function login() {
    if (!email.value.replace(/\s/g, '').length) {
        email.classList.add('is-error');
        return password.classList.add('is-error')
    }
    if (!password.value.replace(/\s/g, '').length) return password.classList.add('is-error');
    const body = await request("https://authserver.mojang.com/authenticate", {
        json: {
            agent: {
                name: "Minecraft",
                version: 1
            },
            "username": email.value,
            "password": password.value,
            "clientToken": uuid()
        }
    }).catch(e => console.error(e))
    if (!body || !body.selectedProfile) {
        email.classList.add('is-error')
        return password.classList.add('is-error')
    }
    fs.writeFileSync(path.join(__dirname, "../../../", "user_cache.json"), JSON.stringify(body))
    email.classList.remove('is-error')
    password.classList.remove('is-error')
    remote.getCurrentWindow().loadFile(path.join(__dirname, 'index.html'))
}