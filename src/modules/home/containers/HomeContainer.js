import React from 'react'
import { useTranslation } from 'react-i18next';

import {
	Container, Row, Col, Jumbotron
} from 'reactstrap';

function HomeContainer(props) {

	const { t, i18n } = useTranslation();

	return (
		<Container fluid className="mt-5 sc-home-container">
			<Row className="justify-content-md-center">
				<Col md={8}>
					<Jumbotron>
						<h1 className="display-4">{t('HomeContainer|Welcome!')}</h1>
						<p className="lead">{t('HomeContainer|This is TeskaLabs SeaCat, cyber-security tool')}</p>
						<hr />
						<p className="mt-4 text-justify">{t('HomeContainer|SeaCat is a comphrehensive security and event management tool')}</p>
						<p className="mt-4 h5">{t('HomeContainer|Please continue to desired agenda by navigating in the menu on the left')}</p>
					</Jumbotron>
				</Col>
			</Row>
		</Container>
	)
}

export default HomeContainer;
