/*
 * GET home page.
 */
/*
 exports.index = function(req, res){
 res.render('index', { title: 'Express' });
 };
 */
var crypto = require('crypto');//crypto是nodejs的一个核心模块，我们用它生成散列值来加密密码
var fs = require('fs');
User = require('../models/user');
Post = require('../models/post');
Comment=require('../models/comment');

//为了维护用户状态和flash的通知功能，我们给每个ejs模板文件传入了以下三个值
//user: req.session.user success:req.flash('success').toString() error:req.flash('error').toString()
module.exports = function (app) {

    app.get('/', function (req, res) {
        //获取所有文章
        Post.getAll(null, function (err, posts) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    //reg:用户注册
    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
            //将成功和错误的信息赋给变量
        });
    });

    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {

        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        //检验用户两次输入的密码是否一致
        if (password_re != password) {
            req.flash('error', '两次输入的密码不一致');
            //重定向功能 实现页面跳转
            return res.redirect('/reg');//返回注册页
        }

        //生成密码的md5值
        var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: req.body.name,
            password: password,
            email: req.body.email
        });
        //检查用户名是否已经存在
        User.get(newUser.name, function (err, user) {
            if (user) {
                req.flash('error', '用户已存在！');
                return res.redirect('/reg');//返回注册页
            }

            //如果不存在则新增用户
            newUser.save(function (err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');//注册失败返回注册页
                }
                //成功！
                req.session.user = user;//用户信息存入session 因为返回了user[0] name
                req.flash('success', '注册成功！');
                res.redirect('/');//注册成功后返回主页
            });
        });
    });


    //login:用户登录
    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    });

    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        //生成密码的md5的值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        //检查用户是否存在
        User.get(req.body.name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在!');
                return res.redirect('/login');//用户不存在则跳转到登录页
            }
            //检查密码是否一致
            if (user.password != password) {
                req.flash('error', '密码错误!');
                return res.redirect('/login');//密码错误则跳转到登陆页
            }
            //用户名和密码都匹配后，将用户信息存入session
            req.session.user = user;
            req.flash('success', '登陆成功！');
            res.redirect('/');//登录成功后跳转到主页
        });
    });

    //post:发表文章
    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var currentUser = req.session.user,
            post = new Post(currentUser.name, req.body.title, req.body.post);
        post.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功！');
            res.redirect('/');
        })
    });

    //logout：登出
    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {

        req.session.user = null;
        req.flash('success', '登出成功！');
        res.redirect('/');//登出成功后跳转到主页
    });

    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: "文件上传",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/upload', checkLogin);
    app.post('/upload', function (req, res) {
        for (var i in req.files) {
            if (req.files[i].size == 0) {
                //使用同步方式删除一个文件
                fs.unlink(req.files[i].path);
                console.log('Successfully removed an empty file!');
            }
            else {
                var target_path = './public/images/' + req.files[i].name;
                //使用同步方式重命名一个文件
                fs.rename(req.files[i].path, target_path);
                console.log('Successfully renamed a file!')
            }
        }
        req.flash('success', '文件上传成功！');
        res.redirect('/upload');
    });

    //添加用户页面
    app.get('/u/:name', function (req, res) {
        //检查用户是否存在
        User.get(req.params.name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在');
                return res.redirect('/');//用户不存在则跳转到主页
            }
            //查询并返回该用户的所有文章
            Post.getAll(user.name, function (err, posts) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });

    //添加文章页面
    app.get('/u/:name/:day/:title', function (req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.post('/u:name/:day/:title',function (req,res) {
       var date=new Date();
           time=date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());

        var comment={
            name:req.body.name,
            email:req.body.email,
            website:req.body.website,
            time:time,
            content:req.body.content
        };

        var newComment=new Comment(req.params.name,req.params.day,req.params.title,comment);
        newComment.save(function (err) {
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','留言成功！');
            res.redirect('back');

        });
    });

    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('edit', {
                title: '编辑',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });

    app.post('/edit/:name/:day/:title',checkLogin);
    app.post('/edit/:name/:day/:title',function (req,res) {
        var currentUser=req.session.user;
        Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function (err) {
           var url='/u/'+req.params.name+'/'+req.params.day+'/'+req.params.title;
            if(err){
                req.flash('error',err);
                return res.redirect(url);//出错 返回文章页
            }
            req.flash('success','修改成功！');
            res.redirect(url);//成功！返回文章页
        });
    });

    app.get('/remove/:name/:day/:title',checkLogin);
    app.get('/remove/:name/:day/:title',function (req,res) {
       var currentUser=req.session.user;
        Post.remove(currentUser.name,req.params.day,req.params.title,function (err) {
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','删除成功！');
            res.redirect('/');
        });
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录！');
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录！');
            res.redirect('back');
        }
        next();
    }

};