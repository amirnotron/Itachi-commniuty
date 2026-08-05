const mongoose = require('mongoose');
const config = require('./config.json');
const GuildConfig = require('./models/GuildConfig.js');

async function moveData() {
    try {
        // ۱. اول به دیتابیس وصل می‌شیم
        await mongoose.connect(config.mongoURI);
        console.log('⏳ در حال اتصال و انتقال اطلاعات به دیتابیس...');

        // ۲. اطلاعات رو از کانفیگ می‌خونیم و تو دیتابیس ذخیره می‌کنیم
        await GuildConfig.findOneAndUpdate(
            { guildId: config.guildId }, // پیدا کردن سرور
            {
                guildId: config.guildId,
                totalMembersChannelId: config.totalMembersChannelId,
                botCountChannelId: config.botCountChannelId,
                onlineMembersChannelId: config.onlineMembersChannelId
            },
            { upsert: true, new: true } // اگر دیتایی برای این سرور نبود، یدونه جدید می‌سازه
        );

        console.log('✅ انتقال اطلاعات با موفقیت انجام شد! Done');
        process.exit(0); // بستن خودکار اسکریپت بعد از پایان کار
    } catch (error) {
        console.error('❌ خطا در انتقال اطلاعات:', error);
        process.exit(1);
    }
}

moveData();