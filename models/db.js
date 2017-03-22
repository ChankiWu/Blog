/**
 * Created by lenovo on 2016/10/9.
 */

var settings=require('../settings'),
    Db=require('mongodb').connect.Db,
    Connection=require('mongodb').connect.Collection,
    Server=require('mongodb').connect.Server;
//module.exports=new Db(settings.db,new Server(settings.host,Connection.DEFAULT_PORT),{safe:true});
module.exports=new Db(settings.db,new Server(settings.host,27017),{safe:true});
//设置数据库名、数据库地址和数据库接口，创建了一个数据库实例，并通过module.exports导出该实例，这样我就可以通过require这个文件来对数据库进行读写了
//localhost:27017

//有一个问题是 DEFAULT_PORT 无法识别 会报错
/*E:\WebStormWorkspace\Blog\node_modules\mongodb\lib\server.js:116
throw MongoError.create({message: 'port must be specified', driver:true});*/

