const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('🎵 سیستم مدیریت حرفه‌ای موزیک')
        .addSubcommand(sub => sub
            .setName('play')
            .setDescription('پخش موزیک با اسم یا لینک')
            .addStringOption(opt => opt.setName('query').setDescription('اسم یا لینک آهنگ').setRequired(true)))
        .addSubcommand(sub => sub.setName('pause').setDescription('توقف موقت یا ادامه پخش'))
        .addSubcommand(sub => sub.setName('skip').setDescription('رفتن به آهنگ بعدی (اسکیپ)'))
        .addSubcommand(sub => sub.setName('repeat').setDescription('تغییر حالت لوپ (خاموش، یک آهنگ، کل لیست)'))
        .addSubcommand(sub => sub.setName('disconnect').setDescription('قطع کردن و خروج ربات از ویس'))
        .addSubcommand(sub => sub.setName('join').setDescription('ورود ربات به کانال ویس شما')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: '❌ اول باید وارد یک چنل Voice بشی!', ephemeral: true });
        }

        const queue = interaction.client.distube.getQueue(interaction.guildId);

        if (sub === 'play') {
            await interaction.deferReply();
            const query = interaction.options.getString('query');
            try {
                await interaction.client.distube.play(voiceChannel, query, {
                    member: interaction.member,
                    textChannel: interaction.channel,
                    interaction
                });
                await interaction.editReply(`🔍 در حال پردازش: **${query}**...`);
            } catch (e) {
                console.error(e);
                await interaction.editReply('❌ مشکلی در پخش به وجود آمد.');
            }
            return; // 👈 این بخش اضافه شد تا بعد از پخش، کد ادامه پیدا نکند
        }

        if (sub === 'join') {
            interaction.client.distube.voices.join(voiceChannel);
            return interaction.reply({ content: '✅ با موفقیت وارد ویس شدم!', ephemeral: true });
        }

        if (sub === 'disconnect') {
            if (queue) queue.stop();
            interaction.client.distube.voices.leave(interaction.guildId);
            return interaction.reply({ content: '👋 از چنل خارج شدم.', ephemeral: true });
        }

        // بررسی اینکه آیا آهنگی در حال پخش است یا خیر (برای بقیه دستورات)
        if (!queue) {
            return interaction.reply({ content: '❌ هیچ آهنگی در حال پخش نیست!', ephemeral: true });
        }

        if (sub === 'pause') {
            if (queue.paused) {
                queue.resume();
                return interaction.reply({ content: '▶️ پخش ادامه یافت.' });
            } else {
                queue.pause();
                return interaction.reply({ content: '⏸️ موزیک متوقف شد.' });
            }
        }

        else if (sub === 'skip') {
            if (queue.songs.length === 1) {
                queue.stop();
                return interaction.reply({ content: '⏹️ این آخرین آهنگ بود و لیست پخش تمام شد.' });
            }
            queue.skip();
            return interaction.reply({ content: '⏭️ رفتیم آهنگ بعدی!' });
        }

        else if (sub === 'repeat') {
            let mode = queue.repeatMode;
            mode = mode === 0 ? 1 : (mode === 1 ? 2 : 0);
            queue.setRepeatMode(mode);

            const modeName = mode === 0 ? 'خاموش (پخش به ترتیب)' : (mode === 1 ? 'تکرار همین آهنگ' : 'تکرار کل لیست صف');
            return interaction.reply({ content: `🔁 سیستم تکرار روی حالت **${modeName}** تنظیم شد.` });
        }
    }
};