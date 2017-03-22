
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var MongoStore=require('connect-mongo')(express);
var settings=require('./settings');
var flash=require('connect-flash');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(express.favicon());
app.use(express.logger('dev'));

//app.use(express.json());
//app.use(express.urlencoded());
//app.use(express.multipart());

//实现上传文件的功能 主要用来上传图片
app.use(express.bodyParser({keepExtensions:true,uploadDir:"./public/images"}));

app.use(express.methodOverride());
app.use(express.cookieParser());//解析的中间件
//提供会话支持
app.use(express.session({
  secret:settings.cookieSecret,
  key:settings.db,//cookie name
  cookie:{maxAge:1000*60*60*24*30},//30 days
  store:new MongoStore({
    db:settings.db,
    url:'mongodb://localhost/'+settings.db,
    autoRemove:'native'
  })
}));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/*
app.get('/', routes.index);//若用户访问主页
app.get('/users', user.list);
*/

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//把实现路由的代码都放到index.js中 然后调用函数接口
routes(app);
