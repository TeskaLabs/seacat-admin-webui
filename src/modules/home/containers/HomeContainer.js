import React from 'react'
import { useTranslation } from 'react-i18next';

import {
	Container, Row, Col, Card
} from 'reactstrap';

function HomeContainer(props) {

	const { t, i18n } = useTranslation();

	// Display a modal window with description
	props.app.addHelpButton("https://docs.teskalabs.com/seacat-auth/");

	return (
		<Container fluid className="mt-5 sc-home-container">
			<Row className="justify-content-md-center">
				<Col md={8}>
					<Card fluid className='py-5 jumbotron'>
						<h1 className="display-4">{t('HomeContainer|Welcome!')}</h1>
						<p className="lead">{t('HomeContainer|This is TeskaLabs SeaCat Admin, cyber-security tool')}</p>
						<hr />
						<p className="mt-3 text-justify">{t('HomeContainer|SeaCat Admin is a comphrehensive security management tool')}</p>
						<p className="h5">{t('HomeContainer|Please continue to desired agenda by navigating in the menu on the left')}</p>
					</Card>
				</Col>
			</Row>
		</Container>
	)
}

export default HomeContainer;
