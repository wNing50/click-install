<p align='center'>
    <img height="150" src="./assests/icon.png">
</p>

## Description

A vscode extention to install dependencies just one click.

No need to `pnpm/npm/yarn add xx` for each times.

## Config

### pkgManager
```json
{
  "click-install.pkgManager": {
    "type": "string",
    "enum": [
      "pnpm",
      "yarn",
      "npm"
    ],
    "description": "Preferred package manager for click-instal."
  }
}
```
If you don't set this config, found by this order automatically.

## License

[MIT](./LICENSE.md) License © 2025 [Nick Wu]
