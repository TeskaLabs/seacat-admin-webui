import { lazy } from 'react';
import { componentLoader } from 'asab-webui';
import Module from 'asab-webui/abc/Module';

const HomeContainer = lazy(() => componentLoader(() => import('./containers/HomeContainer')));

import "./containers/home.scss";

export default class HomeModule extends Module {
	constructor(app, name){
		super(app, "HomeModule");

		app.Router.addRoute({ path: '/home', exact: true, name: 'Homepage', component: HomeContainer });

		app.Navigation.addItem({
			name: 'Home',
			icon: 'at-home',
			url: '/home'
		});

	}
}
