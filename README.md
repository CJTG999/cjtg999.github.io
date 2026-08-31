# CJ GitHub Pages Homepage

A static homepage that automatically discovers public GitHub Pages sites for the configured GitHub account.

## Configure

Open `script.js` and change:

```js
const GITHUB_USER = "cjtg999";
```

## How it works

1. The page gets the account's public repositories from the GitHub REST API.
2. It checks each repository's `/pages` endpoint.
3. Repositories with GitHub Pages enabled become project cards automatically.
4. The card includes the Pages URL, repository URL, description, language, stars, topics, and Pages status.

No backend or GitHub token is required for public repositories.

## Host it at `username.github.io`

The repository itself must be named:

```text
username.github.io
```

For example, for `cjtg999`:

```text
cjtg999.github.io
```

Put `index.html`, `style.css`, and `script.js` in that repository, then enable GitHub Pages from **Settings → Pages** using the `main` branch and `/ (root)`.

Your homepage will then be:

```text
https://cjtg999.github.io/
```
