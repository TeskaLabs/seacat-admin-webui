module.exports = {
	app: {
		modules: [
			"HomeModule"
		]
	},
	devConfig: {
		MOCK_USERINFO: { // Simulate userinfo
			"email": "dev@dev.de",
			"phone_number": "123456789",
			"preferred_username": "Dev",
			"resources": ["seacat:access", "authz:superuser"],
			"roles": ["default/Admin"],
			"sub": "devdb:dev:1abc2def3456",
			"tenants": ["default"]
		},
	},
	webpackDevServer: {
		port: 3000,
		proxy: {
			'/api/seacat_auth': {
				target: "http://127.0.0.1:8080",
				pathRewrite: { '^/api/seacat_auth': ''}
			},
			'/api/openidconnect': {
				target: "http://127.0.0.1:8081",
				pathRewrite: {'^/api' : ''},
			}
		}
	}
}
