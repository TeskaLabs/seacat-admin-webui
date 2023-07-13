module.exports = {
	app: {
		modules: [
			"HomeModule"
		]
	},
	devConfig: {
		MOCK_USERINFO: { // Simulate userinfo
			"email": "dev@dev.de",
			"phone": "123456789",
			"username": "Dev",
			"resources": ["seacat:access", "authz:superuser"],
			"roles": ["default/Admin"],
			"sub": "devdb:dev:1abc2def3456",
			"tenants": ["default"]
		},
	},
	webpackDevServer: {
		port: 3000,
		proxy: {
			'/api/seacat-auth': {
				target: "http://127.0.0.1:8080",
				pathRewrite: { '^/api/seacat-auth': ''}
			},
			'/api/openidconnect': {
				target: "http://127.0.0.1:8081",
				pathRewrite: {'^/api' : ''},
			}
		}
	}
}
