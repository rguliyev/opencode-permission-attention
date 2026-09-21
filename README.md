# OpenCode Permission Attention

A laptop-side OpenCode TUI plugin that announces permission requests even when
the TUI is focused and appends `🔔` to the requesting session's terminal title
while a request remains pending.

The plugin does not read, display, or persist command contents, credentials, or
permission metadata.

## Install

Place `permission-attention.ts` at:

```text
~/.config/opencode/plugins/permission-attention.ts
```

Merge these settings into `~/.config/opencode/tui.json`:

```json
{
  "attention": {
    "enabled": true,
    "notifications": true,
    "sound": false
  },
  "plugin_enabled": {
    "internal:notifications": false
  },
  "plugin": [
    "./plugins/permission-attention.ts"
  ]
}
```

Preserve existing TUI settings and avoid duplicate plugin entries.

## iTerm2

- Enable **Applications in terminal may change the title** under Settings,
  Profiles, General.
- Enable iTerm2 notifications in macOS System Settings.

Fully restart the laptop-side OpenCode TUI process after installing or updating
the plugin. An `opencode connect` remote server does not need to be restarted.
