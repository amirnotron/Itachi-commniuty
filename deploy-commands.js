const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// خوندن تمام فایل‌های داخل پوشه commands
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[اخطار] فایل ${file} ساختار درستی برای کامند ندارد.`);
    }
}

const rest = new REST().setToken(token);

// ارسال کامندها به دیسکورد
(async () => {
    try {
        console.log(`⏳ در حال ارسال ${commands.length} اسلش کامند به دیسکورد...`);

        // این کد کامندها رو مستقیماً توی سرورِ تست شما ثبت می‌کنه تا درجا آپدیت بشن
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`✅ با موفقیت ${data.length} اسلش کامند در سرور ثبت شد!done`);
    } catch (error) {
        console.error('❌ خطا در ثبت کامندها:', error);
    }
})();