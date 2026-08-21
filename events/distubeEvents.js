const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (client) => {
    client.distube
        .on('playSong', (queue, song) => {
            const embed = new EmbedBuilder()
                .setTitle('🎧 در حال پخش')
                .setDescription(`**[${song.name}](${song.url})**`)
                .addFields(
                    { name: '👤 درخواست‌دهنده', value: `${song.user}`, inline: true },
                    { name: '⏱️ زمان', value: `${song.formattedDuration}`, inline: true },
                    { name: '🎤 آرتیست', value: `${song.uploader.name || 'نامشخص'}`, inline: true }
                )
                .setColor('#2c3040')
                .setThumbnail(song.thumbnail);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('music_pause').setEmoji('⏸️').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('music_loop').setEmoji('🔁').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger)
            );

            queue.textChannel.send({ embeds: [embed], components: [row] });
        })
        .on('addSong', (queue, song) => {
            const embed = new EmbedBuilder()
                .setDescription(`✅ آهنگ **${song.name}** به صف پخش اضافه شد!`)
                .setColor('#2c3040');
            queue.textChannel.send({ embeds: [embed] });
        })
        .on('error', (channel, error) => {
            console.error(error);
            if (channel) channel.send('❌ مشکلی در پخش این آهنگ به وجود آمد!');
        });
};