import React from 'react';
import ReactDOM from 'react-dom';
import { Application } from 'asab-webui';
import { HashRouter } from 'react-router-dom';

// Setting external CSS stylesheet file path
// Custom styles will be appended to the styles imported and configured in index.scss
/*
	module.exports = {
		app: {
			css_file_path: 'external_resources/custom.css',
		},
	}
*/

// Load custom CSS stylesheet if available
if (__CONFIG__.css_file_path != undefined) {
	// Create new link element
	const link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('href', __CONFIG__.css_file_path);
	// Append to the `head` element
	document.head.appendChild(link);
}

// Configuration
let ConfigDefaults = {
	title: "SeaCat Admin",
	vendor: "TeskaLabs",
	website: "https://teskalabs.com",
	email: "info@teskalabs.com",
	brand_image: {
		full: "media/logo/header-full.svg",
		minimized: "media/logo/header-minimized.svg",
	},
	sidebarLogo: {
		full: "media/logo/sidebarlogo-full.svg",
		minimized: "media/logo/sidebarlogo-minimized.svg"
	},
	i18n: {
		fallbackLng: 'en',
		supportedLngs: ['en', 'cs'],
		debug: false,
	}
};

var modules = [];

// The load event is fired when the whole page has loaded. Adds a class with which to set the colour from the variable
window.addEventListener('load', (event) => {
	document.body.classList.add('loaded')
})

// Load default modules
import I18nModule from 'asab-webui/modules/i18n';
modules.push(I18nModule);

import TenantModule from 'asab-webui/modules/tenant';
modules.push(TenantModule);

import AuthModule from 'asab-webui/modules/auth';
modules.push(AuthModule);

import AboutModule from 'asab-webui/modules/about';
modules.push(AboutModule);

// Add SeaCat Admin auth module
import SeaCatAuthModule from './modules/auth';
modules.push(SeaCatAuthModule);

// Specify dynamic modules in a config file
/*
	// Example of use
	app: {
		modules: [
			"HomeModule"
		],
	},
*/

// Load custom modules
import HomeModule from './modules/home';

if (__CONFIG__.modules != null) {
	Object.values(__CONFIG__.modules).map((module_name) => {
		switch(module_name) {
			case "HomeModule": modules.push(HomeModule); break;
		}
	});
}

// Option to specify custom default path of the module to be displayed when HomeModule is not loaded
/*
	app: {
		defaultpath: "/auth/credentials",
	},
*/

// Items order in the sidebar
const sidebarItemsOrder = ["Home", "Auth"];

ReactDOM.render((
	<HashRouter>
		<Application
			sidebarItemsOrder={sidebarItemsOrder}
			configdefaults={ConfigDefaults}
			modules={modules}
			defaultpath={__CONFIG__.defaultpath ? __CONFIG__.defaultpath : "/home"}
			hasSidebar={true}
		/>
	</HashRouter>
), document.getElementById('app'));
