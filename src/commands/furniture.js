const Api = require('../service/api');
const fs = require('fs-extra')

module.exports = class FurnitureHandler {
    async handle(ctx) {
        //get args from state
        let args = ctx.args;    
        let redis_key = `Furniture:${args.name}`;
        //get data from redis
        let result = await bot.redis.get(redis_key);
        //check data is empty?
        const getResult = async (name) => {
            let data = await Api.getFurnitureFromJx3box(name);
            let furnitures = data.data;
            let images = [];
            for(let i in furnitures){
                images.push(await bot.imageGenerator.generateFromTemplateFile('furniture', furnitures[i]));
            }
            return images;
        }
        if (result == null || args['update'] || result == 'null') {
            result = await getResult(args.name);
            await bot.redis.set(redis_key, JSON.stringify(result));
            await bot.redis.expire(redis_key, 86400);
        }else{
            let cache_valid = true;
            result = JSON.parse(result);
            if(result instanceof Array && result.length > 0) {
                for(let i in result) {
                    if(!await fs.exists(result[i])){
                        cache_valid = false;
                    }
                }
            }else{
                cache_valid = false;
            }
            if(!cache_valid) {
                result = await getResult(args.name);
                await bot.redis.set(redis_key, JSON.stringify(result));
                await bot.redis.expire(redis_key, 86400);
            }
        }
        return result.map(x => `[CQ:image,file=file://${x}]`).join('\n');
    }

    static argsList() {
        return [
            {
                name: 'name',
                alias: 'furniture',
                displayName: '家具名',
                type: 'furniture',
                defaultIndex: 1,
                shortArgs: null,
                longArgs: 'map',
                limit: null,
                nullable: true,
                default: '阿修罗像'
            }
        ];
    }
}