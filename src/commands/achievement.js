const { htmlToText } = require('html-to-text');
const Api = require('../service/api');
const Image = require('../service/image');
const Cq = require('../service/cqhttp');
const moment = require('moment');

module.exports = class AchievementHandler {
    async handle(ctx) {
        let args = ctx.args;
        let redis_key = `Achievement:${args.achievement}`;
        let result = await bot.redis.get(redis_key);
        if (result == null) {
            let search = await Api.getAchievementSearch(args.achievement);
            let achievementID;

            if (search.code == 200 && search.data.achievements.length > 0) {
                achievementID = search.data.achievements[0].ID;
            } else {
                throw 'ERROR: Unknown Achievement!\n错误：没找到这个成就的数据。';
            }
            let id = achievementID;
            let name = search.data.achievements[0].Name;
            let post = (await Api.getAchievementPost(id)).data.post;
            let html = post.content;
            let updated_at = moment(post.updated * 1000).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss');
            let image = await bot.imageGenerator.generateFromHtml(html);
            result = `咕Bot - 成就攻略 - ${name}
            [CQ:image,file=file://${image}]
            以上内容来源于jx3box用户[${post.user_nickname}]。
            上次更新时间：[${updated_at}]`.replace(/[ ]{2,}/g, "").replace(/\n[\s\n]+/g, "\n");
            await bot.redis.set(redis_key, result);
            await bot.redis.expire(redis_key, 3600);
        }
        return result;
    }

    static argsList() {
        return [{
            name: 'achievement',
            alias: 'achievement',
            displayName: '成就名称',
            type: 'string',
            defaultIndex: 1,
            shortArgs: null,
            longArgs: 'key',
            limit: null,
            nullable: false
        }];
    }
}