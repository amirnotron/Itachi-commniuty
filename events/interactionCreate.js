const { Events, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const Giveaway = require('../models/Giveaway');
const ServerMember = require('../models/ServerMember');
const SecurityConfig = require('../models/SecurityConfig'); // این رو برات اضافه کردم تا سیستم امنیتت ارور نده

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // 🛡️ فیکس مهم: قبلاً فقط اسلش‌کامندها try/catch داشتن؛ ارور توی دکمه‌ها و
        // منوهای کشویی (که خیلی هم زیاد پیش میومد: پرمیشن نداشتن، پیام پاک شده، رِیت‌لیمیت و...)
        // هندل نمی‌شد و باعث کرش کل ربات می‌شد. الان همه‌چیز داخل یک try/catch کلی هست.
        try {

            // ==========================================
            // ۱. هندل کردن اسلش کامندها
            // ==========================================
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;
                try { await command.execute(interaction); }
                catch (error) { console.error(error); }
            }

            // ==========================================
            // ۲. هندل کردن منوهای کشویی داشبورد مدیریت
            // ==========================================
            else if (interaction.isAnySelectMenu()) {
                const { customId, guild, values } = interaction;

                // ==========================================
                // ۱. منوهای مربوط به سیستم تیکت (admin_)
                // ==========================================
                if (customId.startsWith('admin_')) {
                    let dbConfig = await GuildConfig.findOne({ guildId: guild.id }) || new GuildConfig({ guildId: guild.id });

                    if (customId === 'admin_category') dbConfig.ticketCategoryId = values[0];
                    if (customId === 'admin_transcript') dbConfig.transcriptChannelId = values[0];
                    if (customId === 'admin_roles') dbConfig.supportRoleIds = values;
                    if (customId === 'admin_users') dbConfig.supportUserIds = values;

                    await dbConfig.save();

                    const updatedEmbed = new EmbedBuilder()
                        .setTitle('⚙️ داشبورد مدیریت سیستم تیکت')
                        .setDescription('✅ تغییرات شما با موفقیت ذخیره شد!')
                        .addFields(
                            { name: '📁 کتگوری تیکت‌ها', value: dbConfig.ticketCategoryId ? `<#${dbConfig.ticketCategoryId}>` : 'تنظیم نشده', inline: true },
                            { name: '📄 چنل رونوشت', value: dbConfig.transcriptChannelId ? `<#${dbConfig.transcriptChannelId}>` : 'تنظیم نشده', inline: true },
                            { name: '\u200B', value: '\u200B' },
                            { name: '🛡️ رول‌های پشتیبانی', value: dbConfig.supportRoleIds.length ? dbConfig.supportRoleIds.map(id => `<@&${id}>`).join(', ') : 'تنظیم نشده' },
                            { name: '👤 کاربران پشتیبان', value: dbConfig.supportUserIds.length ? dbConfig.supportUserIds.map(id => `<@${id}>`).join(', ') : 'تنظیم نشده' }
                        )
                        .setColor('Green');

                    return await interaction.update({ embeds: [updatedEmbed] });
                }

                // ==========================================
                // ۲. منوهای مربوط به سیستم امنیت (sec_)
                // ==========================================
                if (customId.startsWith('sec_')) {
                    let secConfig = await SecurityConfig.findOne({ guildId: guild.id }) || new SecurityConfig({ guildId: guild.id });

                    if (customId === 'sec_invite_channels') secConfig.antiLink.allowedInviteChannels = values;
                    if (customId === 'sec_web_channels') secConfig.antiLink.allowedWebChannels = values;
                    if (customId === 'sec_roles') secConfig.antiLink.whitelistedRoles = values;
                    if (customId === 'sec_users') secConfig.antiLink.whitelistedUsers = values;

                    await secConfig.save();

                    const updatedEmbedSec = new EmbedBuilder()
                        .setTitle('🛡️ مرکز کنترل امنیت و آنتی‌اسپم سرور')
                        .setDescription('✅ تغییرات سیستم امنیت با موفقیت ذخیره شد.')
                        .addFields(
                            { name: '🌐 چنل‌های مجاز لینک اینوایت', value: secConfig.antiLink.allowedInviteChannels.length ? secConfig.antiLink.allowedInviteChannels.map(id => `<#${id}>`).join(', ') : 'هیچکدام', inline: false },
                            { name: '🔗 چنل‌های مجاز لینک‌های عمومی', value: secConfig.antiLink.allowedWebChannels.length ? secConfig.antiLink.allowedWebChannels.map(id => `<#${id}>`).join(', ') : 'هیچکدام', inline: false },
                            { name: '🛡️ رول‌های استثنا (Whitelist Roles)', value: secConfig.antiLink.whitelistedRoles.length ? secConfig.antiLink.whitelistedRoles.map(id => `<@&${id}>`).join(', ') : 'هیچکدام', inline: true },
                            { name: '👤 کاربران استثنا (Whitelist Users)', value: secConfig.antiLink.whitelistedUsers.length ? secConfig.antiLink.whitelistedUsers.map(id => `<@&${id}>`).join(', ') : 'هیچکدام', inline: true }
                        )
                        .setColor('Green');

                    return await interaction.update({ embeds: [updatedEmbedSec] });
                }
            }

            // ==========================================
            // ۳. هندل کردن دکمه‌ها (موزیک، داشبورد و تیکت)
            // ==========================================
            else if (interaction.isButton()) {

                // 🎵 دکمه‌های کنترل سیستم موزیک
                if (interaction.customId.startsWith('music_')) {
                    const queue = client.distube.getQueue(interaction.guildId);
                    if (!queue) return interaction.reply({ content: '❌ آهنگی در حال پخش نیست!', ephemeral: true });

                    if (interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
                        return interaction.reply({ content: '❌ شما باید در کانال ویسِ ربات باشید!', ephemeral: true });
                    }

                    switch (interaction.customId) {
                        case 'music_pause':
                            if (queue.paused) queue.resume();
                            else queue.pause();
                            return interaction.reply({ content: queue.paused ? '⏸️ موزیک متوقف شد.' : '▶️ پخش موزیک ادامه یافت.', ephemeral: true });

                        case 'music_skip':
                            if (queue.songs.length === 1) queue.stop();
                            else queue.skip();
                            return interaction.reply({ content: '⏭️ آهنگ اسکیپ شد.', ephemeral: true });

                        case 'music_loop':
                            const mode = queue.repeatMode === 0 ? 1 : (queue.repeatMode === 1 ? 2 : 0);
                            queue.setRepeatMode(mode);
                            const modeStr = mode === 0 ? 'خاموش' : (mode === 1 ? 'تکرار یک آهنگ' : 'تکرار کل لیست');
                            return interaction.reply({ content: `🔁 لوپ تغییر کرد: **${modeStr}**`, ephemeral: true });

                        case 'music_stop':
                            queue.stop();
                            return interaction.reply({ content: '⏹️ آهنگ متوقف و صف پاک شد.', ephemeral: true });
                    }
                    return;
                }

                // 🎁 دکمه شرکت در قرعه‌کشی (گیووی)
                if (interaction.customId === 'gw_join') {
                    await interaction.deferReply({ ephemeral: true });

                    const gw = await Giveaway.findOne({ messageId: interaction.message.id });
                    if (!gw) return interaction.editReply('❌ این گیووی دیگر در دیتابیس موجود نیست.');
                    if (gw.ended) return interaction.editReply('❌ زمان این قرعه‌کشی به پایان رسیده است.');

                    if (gw.participants.includes(interaction.user.id)) {
                        gw.participants = gw.participants.filter(id => id !== interaction.user.id);
                        await gw.save();
                        return interaction.editReply('✅ شما از لیست شرکت‌کنندگان این قرعه‌کشی خارج شدید.');
                    }

                    if (gw.reqInvites > 0) {
                        const memberData = await ServerMember.findOne({ guildId: interaction.guild.id, userId: interaction.user.id });
                        const validInvites = memberData
                            ? memberData.inviteTimestamps.filter(timestamp => timestamp >= gw.createdAt).length
                            : 0;

                        if (validInvites < gw.reqInvites) {
                            return interaction.editReply(`❌ شما شرایط لازم را ندارید!\n\nشما از زمان شروع این گیووی تا الان **${validInvites}** نفر را دعوت کرده‌اید.\nشما به **${gw.reqInvites - validInvites}** دعوت دیگر نیاز دارید.`);
                        }
                    }

                    gw.participants.push(interaction.user.id);
                    await gw.save();
                    return interaction.editReply('🎉 شما با موفقیت در این قرعه‌کشی شرکت کردید!');
                }

                // 🎫 هندل کردن دکمه‌های تیکت
                const dbConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
                if (!dbConfig) return;

                if (interaction.customId === 'admin_send_panel') {
                    const embed = new EmbedBuilder()
                        .setTitle('🎫 پشتیبانی سرور')
                        .setDescription('برای گفتگو با تیم پشتیبانی و مطرح کردن مشکلات خود، روی دکمه زیر کلیک کنید.')
                        .setColor('White');

                    const btn = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('create_ticket').setLabel('ایجاد تیکت').setStyle(ButtonStyle.Primary).setEmoji('📩')
                    );

                    await interaction.channel.send({ embeds: [embed], components: [btn] });
                    return interaction.reply({ content: '✅ پنل تیکت با موفقیت ارسال شد.', ephemeral: true });
                }

                if (interaction.customId === 'create_ticket') {
                    if (!dbConfig.ticketCategoryId) return interaction.reply({ content: '❌ کتگوری تیکت هنوز در داشبورد مدیریت تنظیم نشده است.', ephemeral: true });
                    await interaction.deferReply({ ephemeral: true });

                    const permissionOverwrites = [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                    ];

                    dbConfig.supportRoleIds.forEach(id => permissionOverwrites.push({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }));
                    dbConfig.supportUserIds.forEach(id => permissionOverwrites.push({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }));

                    const ticketChannel = await interaction.guild.channels.create({
                        name: `ticket-${interaction.user.username}`,
                        type: ChannelType.GuildText,
                        parent: dbConfig.ticketCategoryId,
                        topic: interaction.user.id,
                        permissionOverwrites
                    });

                    const welcomeEmbed = new EmbedBuilder()
                        .setTitle('🎫 تیکت پشتیبانی')
                        .setDescription(`سلام ${interaction.user} عزیز!\nمنتظر بمانید تا تیم پشتیبانی به شما پاسخ دهند.`)
                        .setColor('DarkAqua');

                    const closeBtn = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('close_ticket').setLabel('بستن تیکت').setEmoji('🔒').setStyle(ButtonStyle.Danger)
                    );

                    await interaction.editReply(`✅ تیکت ساخته شد: ${ticketChannel}`);

                    const supportMentions = [...dbConfig.supportRoleIds.map(id => `<@&${id}>`), ...dbConfig.supportUserIds.map(id => `<@${id}>`)].join(' ');
                    await ticketChannel.send({ content: `${interaction.user} | ${supportMentions}`, embeds: [welcomeEmbed], components: [closeBtn] });
                }

                else if (interaction.customId === 'close_ticket') {
                    await interaction.deferReply();
                    const ownerId = interaction.channel.topic;
                    if (ownerId) await interaction.channel.permissionOverwrites.edit(ownerId, { ViewChannel: false });

                    await interaction.channel.setName(`closed-${interaction.user.username}`);
                    const closedEmbed = new EmbedBuilder().setTitle('🔒 تیکت بسته شد').setDescription('پنل مدیریت تیکت:').setColor('Yellow');
                    const controlButtons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('reopen_ticket').setLabel('باز کردن').setEmoji('🔓').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('transcript_ticket').setLabel('رونوشت').setEmoji('📄').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('delete_ticket').setLabel('حذف').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
                    );
                    await interaction.editReply({ embeds: [closedEmbed], components: [controlButtons] });
                }

                // ---- باز کردن مجدد ----
                else if (interaction.customId === 'reopen_ticket') {
                    await interaction.deferReply();
                    const ownerId = interaction.channel.topic;
                    if (ownerId) await interaction.channel.permissionOverwrites.edit(ownerId, { ViewChannel: true, SendMessages: true });
                    await interaction.channel.setName(`ticket-${interaction.user.username}`);
                    await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🔓 تیکت مجدداً باز شد').setColor('Green')] });
                }

                // ---- گرفتن رونوشت (Transcript) ----
                else if (interaction.customId === 'transcript_ticket') {
                    await interaction.deferReply();
                    const messages = await interaction.channel.messages.fetch({ limit: 100 });
                    const transcriptText = messages.reverse().map(m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
                    const buffer = Buffer.from(transcriptText, 'utf-8');
                    const attachment = new AttachmentBuilder(buffer, { name: `${interaction.channel.name}-transcript.txt` });

                    if (dbConfig.transcriptChannelId) {
                        const transcriptCh = interaction.guild.channels.cache.get(dbConfig.transcriptChannelId);
                        if (transcriptCh) {
                            await transcriptCh.send({ content: `📄 رونوشت تیکت **${interaction.channel.name}**`, files: [attachment] });
                            return interaction.editReply({ content: '✅ فایل رونوشت با موفقیت به چنل لاگ‌ها ارسال شد.' });
                        }
                    }

                    await interaction.editReply({ content: '📄 فایل رونوشت آماده شد:', files: [attachment] });
                }

                // ---- حذف کامل ----
                else if (interaction.customId === 'delete_ticket') {
                    await interaction.reply('🗑️ چنل تا ۵ ثانیه دیگر حذف خواهد شد...');
                    setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
                }
            }

        } catch (error) {
            // 🛡️ هر ارور غیرمنتظره‌ای که توی بخش دکمه‌ها/منوها پیش بیاد اینجا گیر میفته
            console.error('❌ خطای پیش‌بینی‌نشده در interactionCreate:', error);
        }
    }
};