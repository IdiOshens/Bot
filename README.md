
# Zark-Bots - WhatsApp Bot (Created by Zark Bryan)

Zark-Bots is a versatile WhatsApp bot built with Node.js, TypeScript, and Baileys, featuring a wide array of commands including AI chat, various tools, games, downloaders, and group management utilities.

## Features

*   **AI Chat:** Engage with advanced AI models (powered by Google Gemini).
*   **Tools:** Calculator, QR code generator/reader, URL shortener, screenshotter, and more.
*   **Downloads:** Fetch media from various sources (YouTube song download fully functional, placeholders for some other services).
*   **Group Management:** Kick, add, promote, demote, tag members, manage group settings (antilink with kick, etc.).
*   **Fun & Games:** Tic-Tac-Toe, jokes, memes, quotes.
*   **Economy System:** Earn, spend, and transfer virtual currency.
*   **Customizable:** Owner panel for bot administration and configuration, including runtime `.env` management via `.settings` command.
*   **Interactive Menu:** Easy-to-navigate command categories.
*   **And many more!** Explore via the `.menu` and `.allcmds` (owner) commands.

## Prerequisites

*   Node.js (v16.x or higher recommended)
*   npm (comes with Node.js) or yarn (optional, install separately if preferred)
*   FFmpeg (for audio/video processing commands) - Install separately and ensure it's in your system's PATH. This is mainly for the `.bass`, `.deep`, etc. audio editing commands and potentially some download processing.

## Setup & Installation

1.  **Clone the Repository (or download the source code):**
    ```bash
    git clone <your-repository-url> Zark-Bots 
    cd Zark-Bots
    ```

2.  **Install Dependencies:**
    In the project's root directory, run:
    ```bash
    npm install
    ```
    If you encounter `ERESOLVE` errors, try:
    ```bash
    npm install --legacy-peer-deps
    ```
    If it still doesn't work `USE`
    ```bash
    npm install @google/genai@latest --legacy-peer-deps
    ```
    And that
    ```
    npm install fluent-ffmpeg@latest --legacy-peer-deps

    ```
    And
    ```
    npm install dotenv --legacy-peer-deps
    ```
    
4.  **Configuration (Environment Variables):**
    Create a file named `.env` in the root directory (`Zark-Bots/.env`).
    Copy and paste the following template, then **modify the values, especially `GEMINI_API_KEY` and `OWNER_NUMBERS`**:

    ```env
    # BOT CONFIGURATION
    BOT_NAME="Zark-Bots"
    BOT_PREFIX="."
    # Replace with YOUR WhatsApp number(s) without '+', e.g., 1234567890. For multiple owners, separate by comma: 1234567890,0987654321
    OWNER_NUMBERS="YOUR_WHATSAPP_NUMBER_HERE" 
    BOT_IMAGE_URL="https://telegra.ph/file/1c312702636a669643b09.jpg" # URL for bot image in menus/allcmds

    # API KEYS - VERY IMPORTANT
    # Get from Google AI Studio: https://aistudio.google.com/app/apikey
    # The user provided: AIzaSyDEw3hjX5PL-XXyoSgKCPq0TFuHJJoeRac
    # Replace "YOUR_GOOGLE_GEMINI_API_KEY" below with your actual key.
    GEMINI_API_KEY="AIzaSyDEw3hjX5PL-XXyoSgKCPq0TFuHJJoeRac" 

    # FEATURES (true/false) - Customize bot behavior
    BOT_MODE="public" # "public" (anyone can use) or "private" (only owners can use)
    AUTO_REPLY_ENABLED=false 
    WELCOME_MESSAGE_ENABLED=true 
    GOODBYE_MESSAGE_ENABLED=true 

    # Owner Panel Features (default states, can be toggled by owner commands or .settings)
    ANTI_CALL_ENABLED=true
    AUTO_BIO_ENABLED=false
    AUTO_TYPING_ENABLED=true
    ALWAYS_ONLINE_ENABLED=false
    AUTO_READ_ENABLED=false
    AUTO_STATUS_VIEW_ENABLED=false
    ANTI_DELETE_ENABLED=true
    SUDO_USERS="" # Comma-separated JIDs for sudo access, e.g., 123@s.whatsapp.net,456@s.whatsapp.net

    # Optional: Log level for pino logger (e.g., 'info', 'debug', 'warn', 'error', 'fatal', 'trace', 'silent')
    LOG_LEVEL="info"
    ```

    **CRITICAL:**
    *   **`OWNER_NUMBERS`**: Your WhatsApp number(s) for owner privileges.
    *   **`GEMINI_API_KEY`**: **MUST** be a valid key from [Google AI Studio](https://aistudio.google.com/app/apikey). The bot's code reads this from the environment; the value above is an example.
    *   The bot uses `dotenv` to load these variables.

5.  **Build the TypeScript code:**
    ```bash
    npm run build
    ```

## Running the Bot

1.  **Start the Bot:**
    ```bash
    npm start
    ```
    For development with auto-restart:
    ```bash
    npm run dev
    ```

2.  **Pairing / Authentication (Connecting to WhatsApp):**
    *   On first run, a **QR code** will appear in your terminal.
    *   Open WhatsApp on your phone: **Settings** > **Linked Devices** > **Link a Device**.
    *   Scan the QR code. If a pairing code is shown, use "Link with phone number instead."
    *   The `baileys_auth_info` folder stores your session. **Do NOT delete it unless re-pairing.**

## Owner Command: `.settings` (Manage .env)

Owners can manage the bot's environment variables stored in the `.env` file directly through WhatsApp.
**CAUTION:** This is a powerful command. Incorrectly changing settings can break the bot. **A bot restart (`.restart`) is required for changes to take effect.**

*   **`.settings view`**: Displays current variables from `.env` (sensitive ones like API keys will be masked).
*   **`.settings list`**: Lists all variable names found in the `.env` file.
*   **`.settings set <VARIABLE_NAME> <new_value>`**: Sets or updates a variable in the `.env` file.
    *   Example: `.settings set BOT_MODE private`
    *   After using `set`, you **MUST** use `.restart` for the changes to apply.

## Deployment

### Deploying to Render.com (Recommended for ease of use with persistence)

Render.com is a good platform for hosting Node.js applications with persistent storage.

1.  **Sign up/Log in to Render.com.**
2.  **Create a New "Web Service":**
    *   Connect your GitHub repository (where you've pushed your Zark-Bots code).
    *   **Environment:** Select `Node`.
    *   **Region:** Choose a region close to you.
    *   **Branch:** Select your main branch (e.g., `main` or `master`).
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `npm start`
    *   **Instance Type:** Choose a suitable plan (Render has a free tier for web services, but check limitations).
3.  **Add Environment Variables:**
    *   Go to your service's "Environment" tab on Render.
    *   Add all the variables from your local `.env` file (e.g., `BOT_NAME`, `GEMINI_API_KEY`, `OWNER_NUMBERS`, etc.).
    *   **Important for `GEMINI_API_KEY`:** Ensure you set your actual valid key here.
4.  **Add a Persistent Disk for `baileys_auth_info`:**
    *   This is crucial so you don't have to re-pair the bot every time it restarts.
    *   Go to your service's settings on Render.
    *   Find the "Disks" section and click "Add Disk".
    *   **Name:** `baileys-auth` (or similar)
    *   **Mount Path:** `/app/baileys_auth_info` (Render typically builds your app in `/app/` or `/opt/render/project/src/`) - verify the exact path if needed by checking build logs or file browser if available. If your project root is `/app/`, then this path is correct.
    *   **Size:** 1 GB should be more than enough.
    *   Click "Create Disk".
    *   Your `useMultiFileAuthState('baileys_auth_info')` in `src/index.ts` will then use this persistent disk.
5.  **Deploy:**
    *   Click "Create Web Service" or trigger a manual deploy if you've already created it.
    *   Monitor the deploy logs. The first time, it will build and start.
    *   You'll need to check the logs for the QR code to pair WhatsApp. Render's log streaming will show the terminal output.
6.  **Health Checks (Optional but Recommended):**
    *   Render uses health checks to ensure your service is running. A simple HTTP health check endpoint might be needed if your bot doesn't open an HTTP port by default (which this one doesn't).
    *   For a Baileys bot, a true health check is tricky. You might need a small HTTP server part in your bot just for Render's health check, or rely on Render's process health monitoring. For basic setups, Render might just monitor if the `npm start` process is running.

### Other Platforms (Heroku, Railway, VPS)

*   **Heroku:** Similar to Render, but persistent storage for `baileys_auth_info` is more complex (often requires add-ons or re-pairing). Set `Procfile` to `worker: npm start` if it's not a web-facing app.
*   **Railway.app:** Good alternative, also supports persistent volumes.
*   **VPS (e.g., DigitalOcean, AWS EC2, Linode):**
    *   Manually set up Node.js, clone repo, install dependencies.
    *   Use a process manager like PM2:
        ```bash
        pm2 start npm --name "zark-bot" -- start
        pm2 save
        pm2 startup 
        ```
    *   Manage environment variables using `.env` or system settings. `baileys_auth_info` will persist naturally on a VPS filesystem.

**General Deployment Tips:**
*   **Security:** **NEVER** commit your `baileys_auth_info` folder or your `.env` file (if it contains sensitive keys) to a public Git repository. Add them to your `.gitignore` file:
    ```gitignore
    node_modules/
    dist/
    baileys_auth_info/
    *.log
    .env
    temp_audio/
    temp_vcf/ 
    # Add other temp directories if created
    ```
*   **Logging:** Check logs on your hosting platform for monitoring and troubleshooting.
*   **Resource Management:** Monitor CPU/memory, especially on free/limited tiers.

## Using the Bot

1.  **Send commands** (default prefix `.`) from any chat (if public) or your owner account.
2.  Type `.menu` for the interactive command menu.
3.  Owners: Use `.allcmds` for a full command list. Use `.settings` to manage environment variables.
4.  Help: `.command help` (e.g., `.ping help`).

## Troubleshooting Common Issues

*   **`ERESOLVE` errors during `npm install`:** Use `npm install --legacy-peer-deps`.
*   **QR Code Not Appearing/Working:** Check terminal size/font. Use pairing code if available.
*   **Bot Disconnecting:** Check internet, ensure WhatsApp Web isn't open on multiple other devices for the bot's number.
*   **"Gemini AI not configured"**: Ensure `GEMINI_API_KEY` is valid and set in your environment variables (or via `.settings set GEMINI_API_KEY yourkey` followed by `.restart`).
*   **Audio/Video Commands Not Working:** Ensure FFmpeg is installed and in PATH. YouTube downloads depend on `ytdl-core` and can be affected by YouTube changes.

## Contributing

Contributions are welcome! Please fork, make changes, and submit a pull request.

## License

This project is licensed under the ISC License.

---
*This bot is created by **Zark Bryan** and aims to provide a feature-rich WhatsApp experience making WhatsApp fun to use.*
*Please use responsibly and be mindful of WhatsApp's Terms of Service.*
```
  </change>
</changes>
```

I've added the `.settings` command for you. It's a powerful tool, so please use it with caution:

*   **Located in `src/commands/owner.ts`**.
*   **Strictly Owner-Only**: Only numbers listed in `OWNER_NUMBERS` can use it.
*   **Functionality**:
    *   `.settings view`: Shows current variables from your `.env` file. API keys and other sensitive data will be masked (e.g., "Set (Hidden)").
    *   `.settings list`: Lists all variable names found in your `.env` file that the bot can attempt to modify.
    *   `.settings set <VARIABLE_NAME> <new_value>`: This will attempt to update the specified variable in your actual `.env` file on the server.
        *   **Example**: `.settings set BOT_MODE private`
        *   **CRITICAL**: After using `.settings set ...`, you **MUST** use the `.restart` command for the changes to take effect. The bot loads these settings from the `.env` file only when it starts.
*   **Styling**: The command output is styled similarly to other bot messages for consistency.
*   **`dotenv` Package**: I've added `dotenv` to `package.json` and ensured it's configured at the very top of `src/index.ts`. This is crucial for loading your `.env` file correctly when the bot starts (and after restarts).

**Important Reminders for `.settings`:**

1.  **Restart Required**: Changes made with `.settings set` will **not** apply until you restart the bot using the `.restart` command.
2.  **Security**: Be very careful with this command. Changing essential variables incorrectly (like API keys or paths) could make the bot stop working.
3.  **File Permissions**: The bot process needs write permission to the `.env` file for the `set` subcommand to work. This is usually fine in typical local or VPS setups, but on some hosting platforms, it might be restricted.
4.  **Backup**: It's always a good idea to have a backup of your `.env` file.

This should give you the control you're looking for over the bot's environment settings directly from WhatsApp. Remember the restart step!
