/**
 * Created by lenovo on 2016/10/19.
 */

var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, post) {
    this.name = name;
    this.title = title;
    this.post = post;
}

module.exports = Post;

//仿照用户模型，我们将文章模型命名为post对象，他拥有与User相似的接口，分别是Post.get和Post.prototype.save。
//Post.get的功能是从数据库中获取文章，可以按指定用户获取，也可以获取全部的内容。
//Post.prototype.save是Post对象原型的方法，用来将文章保存到数据库

//存储一篇文章及其相关信息
Post.prototype.save = function (callback) {
    var date = new Date();
    //存储各种时间形式，方便以后扩展
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };
    //要存入数据库的文档
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        post: this.post,
        comments:[]//存储文章的留言
    };

    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取post集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //将文档插入posts集合
            collection.insert(post, {
                safe: true
            }, function (err) {
                mongodb.close();

                if (err) {
                    return callback(err);//失败！
                }
                callback(null);//成功！
            });
        });
    })
};

// 获取一个人name的所有文章
Post.getAll = function (name, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {

            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (errr, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            //根据query对象查询文章
            collection.find(query).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);//失败
                }

                //解析markdown为html
                docs.forEach(function (doc) {
                    doc.post = markdown.toHTML(doc.post);
                });

                callback(null, docs);//成功！以数组形式返回查询的结果
            });
        });
    });
};

//获取一篇文章
Post.getOne = function (name, day, title, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                //解析markdown为html
                if(doc){
                    doc.post = markdown.toHTML(doc.post);
                    //报错
                  /* doc.comments.forEach(function (comment,thisArg) {
                       comment.content=markdown.toHTML(comment.content);
                    });*/
                }

                callback(null, doc);//返回查询的一篇文章
            });
        });
    });
};

//返回原始发表的内容(markdown 格式)
Post.edit = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);//返回查询的一篇文章
            });
        });
    });
};

//更新一篇文章及其相关信息
Post.update = function (name, day, title, post, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            //更新文章内容
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $set: {post: post}
            },function (err) {
              mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

//删除一篇文章
Post.remove=function (name,day,title,callback) {
  //打开数据库
    mongodb.open(function (err,db) {
        if(err)
        {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //根据用户名、日期和标题查找并删除一篇文章
            collection.remove({
                "name":name,
                "time.day":day,
                "title":title
            },{
                w:1
            },function (err) {
               mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};