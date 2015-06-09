var ss=require("sdk/simple-storage");
var request=require("sdk/request");
var tabs = require("sdk/tabs");
var pageMod = require("sdk/page-mod");
var self = require("sdk/self");

module.exports={
	getToken: function(){
		return ss.storage.access_token;
	},
	login: function(options,callback){
		/* options should have scopes, client id, client secret, loginHtml, loginJs, callback*/
		var url="https://accounts.google.com/o/oauth2/auth?scope="+options.scopes+"&response_type=code&redirect_uri=urn:ietf:wg:oauth:2.0:oob&client_id="+options.client_id;
		var tab_oauth;
		var tab_login;
		tabs.open({
			url: url,
			onOpen: function(tab) {
					tab_oauth = tab;
			}});
		pageMod.PageMod({
			include: self.data.url(options.loginHtml),
			contentScriptFile: self.data.url(options.loginJs),
			onMessage: function(code){
						request.Request({
							url: "https://www.googleapis.com/oauth2/v3/token",
							content: {
								code: code,
								client_id: options.client_id,
								client_secret: options.client_secret,
								grant_type: "authorization_code",
								redirect_uri: "urn:ietf:wg:oauth:2.0:oob"
							},
							onComplete: function(response){
								tab_oauth.close();
								tab_login.close();
								ss.storage.access_token=response.json.access_token;
								ss.storage.refresh_token=response.json.refresh_token;
								callback(ss.storage.access_token);
							}
						}).post();
			}
		});
		tabs.open({
			url: self.data.url(options.loginHtml),
			onOpen: function(tab) {
					tab_login = tab;
			}});
	},
	refreshToken: function(options, callback){
		if(ss.storage.refresh_token == undefined)
		{
			this.login(options, callback);
		}else{
			request.Request({
				url: "https://www.googleapis.com/oauth2/v3/token",
				content: {
					refresh_token: ss.storage.refresh_token,
					client_id: options.client_id,
					client_secret: options.client_secret,
					grant_type: "refresh_token"
				},
				onComplete: function(response){
					ss.storage.access_token=response.json.access_token;
					callback(ss.storage.access_token);
				}
			}).post();
		}
	},
}
