const Group = require("../model/group");
const moment = require('moment');


module.exports = class GroupHandler {
    static demandPermission = true;

    async handle(ctx) {
        let args = ctx.args;
        let action = args.action;
        if (action == 'info') {
            return await this.info(ctx);
        } else if (action == 'server') {
            return await this.server(ctx);
        } else if (action == 'nickname') {
            return await this.nickname(ctx);
        } else if (action == 'convenient') {
            return await this.convenient(ctx);
        }
    }

    async info(ctx) {
        if (ctx.data.message_type == 'group') {
            let group_id = ctx.data.group_id;
            let redis_key = `GroupInfo:${group_id}`;
            let result = await redis.get(redis_key);
            if (result == null) {
                let group = await Group.findOne({
                    where: {
                        group_id: group_id
                    }
                });
                if (group == null) {
                    group = await Group.create({
                        group_id: group_id,
                        server: '唯我独尊',
                        nickname: group_id
                    });
                }
                result = `------咕Bot·本群配置------
                群称呼：${group.nickname}
                群默认服务器：${group.server}
                便捷命令开关：${group.convenient}
                机器人入群时间：${moment(group.created_at).format('YYYY-MM-DD hh:mm:ss')}
                `
                await redis.set(redis_key, result);
            }
            return result.replace(/[ ]{2,}/g, "").replace(/\n[\s\n]+/g, "\n");
        } else if (ctx.data.message_type == 'private') {
            return '本命令仅限群内使用';
        }
    }

    async server(ctx) {
        let server = ctx.args.server;
        if (ctx.data.message_type == 'group') {
            if (server != null && server != undefined) {
                if (ctx.permissions < 4) {
                    return '权限不足。'
                }
                let group_id = ctx.data.group_id;
                let group = await Group.findOne({
                    where: {
                        group_id: group_id
                    }
                });
                if (group == null) {
                    group = await Group.create({
                        group_id: group_id,
                        server: server,
                        nickname: group_id
                    });
                } else {
                    group.server = server;
                    group.save();
                }
                let redis_key = `GroupInfo:${group_id}`;
                await redis.del(redis_key);
                return '本群默认服务器已被修改为：' + server;
            } else {
                return this.info(ctx);
            }
        } else if (ctx.data.message_type == 'private') {
            return '本命令仅限群内使用';
        }
    }

    async nickname(ctx) {
        let nickname = ctx.args.nickname;
        if (ctx.data.message_type == 'group') {
            if (nickname != null && nickname != undefined) {
                if (ctx.permissions < 4) {
                    return '权限不足。'
                }
                let group_id = ctx.data.group_id;
                let group = await Group.findOne({
                    where: {
                        group_id: group_id
                    }
                });
                if (group == null) {
                    group = await Group.create({
                        group_id: group_id,
                        server: '唯我独尊',
                        nickname: nickname,
                    });
                } else {
                    group.nickname = nickname;
                    group.save();
                }
                let redis_key = `GroupInfo:${group_id}`;
                await redis.del(redis_key);
                return '本群称呼已被修改为：' + nickname;
            } else {
                return this.info(ctx);
            }
        } else if (ctx.data.message_type == 'private') {
            return '本命令仅限群内使用';
        }
    }

    async convenient(ctx) {
        let swi = ctx.args.switch;
        if (ctx.data.message_type == 'group') {
            if (swi != null && swi != undefined) {
                if (ctx.permissions < 4) {
                    return '权限不足。'
                }
                let group_id = ctx.data.group_id;
                let group = await Group.findOne({
                    where: {
                        group_id: group_id
                    }
                });
                if (group == null) {
                    group = await Group.create({
                        group_id: group_id,
                        server: '唯我独尊',
                        nickname: group_id,
                        convenient: swi=='true' ? true : false 
                    });
                } else {
                    group.convenient = swi=='true' ? true : false;
                    group.save();
                }
                let redis_key = `GroupConvenient:${group_id}`;
                await redis.set(redis_key, swi=='true'? true : false);
                redis_key = `GroupInfo:${group_id}`;
                await redis.del(redis_key);
                return '本群简便命令开关已被修改为：' + swi;
            } else {
                return this.info(ctx);
            }
        } else if (ctx.data.message_type == 'private') {
            return '本命令仅限群内使用';
        }
    }

    static argsList() {
        return {
            action: {
                name: 'action',
                alias: 'group_action',
                type: 'string',
                defaultIndex: 1,
                shortArgs: null,
                longArgs: 'action',
                limit: ['server', 'info', 'nickname', 'convenient'],
                nullable: true,
                default: 'info'
            },
            branch: {
                info: [],
                server: [{
                    name: 'server',
                    alias: 'server',
                    type: 'server',
                    defaultIndex: 2,
                    shortArgs: null,
                    longArgs: 'server',
                    limit: null,
                    nullable: true,
                    default: null
                }],
                nickname: [{
                    name: 'nickname',
                    alias: null,
                    type: 'string',
                    defaultIndex: 2,
                    shortArgs: null,
                    longArgs: 'nickname',
                    limit: null,
                    nullable: true,
                    default: null
                }],
                convenient: [{
                    name: 'switch',
                    alias: 'boolean',
                    type: 'boolean',
                    defaultIndex: 2,
                    shortArgs: null,
                    longArgs: 'switch',
                    limit: null,
                    nullable: true,
                    default: null
                }],
            }
        };
    }
}