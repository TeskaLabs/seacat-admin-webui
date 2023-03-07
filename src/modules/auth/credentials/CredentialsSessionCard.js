import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

import {
	Row, Col,
	Card, CardHeader, CardFooter, CardBody
} from 'reactstrap';

import { ButtonWithAuthz } from 'asab-webui';

function CredentialsSessionCard(props) {
	const data = props.data;
	const { t, i18n } = useTranslation();

	// Set terminate session dialog
	const terminateSessionsForm = () => {
		var r = confirm(t("CredentialsSessionCard|Do you want to terminate user sessions?"));
		if (r == true) {
			terminateSessions();
		}
	}

	// Terminate users sessions
	const terminateSessions = async () => {
		let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
		try {
			let response = await SeaCatAuthAPI.delete(`/sessions/${props.credentials_id}`);
			if (response.data.result !== "OK") {
				throw new Error(t("CredentialsSessionCard|Something went wrong when terminating sessions"));
			}
			props.app.addAlert("success", t("CredentialsSessionCard|Sessions successfully terminated"));
			props.retrieveSessions();
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsSessionCard|Failed to terminate sessions")}. ${e?.response?.data?.message}`, 30);
		}
	}

	return(
		<Card className="h-100 credential-session-area">
			<CardHeader className="border-bottom">
				<div className="card-header-title">
					<i className="cil-link pr-2"></i>
					{t("CredentialsSessionCard|Sessions")}
				</div>
			</CardHeader>
			<CardBody className="card-body-scroll">
				{data.length > 0 ? data.map((session, idx) => {
					return(
						<Row key={idx}>
							<Col style={{overflowX: "auto"}}>
								<Link to={{ pathname:`/auth/session/${session._id}` }} className="user-session">
									<i className="cil-link"></i>
									{' '}
									{session._id}
								</Link>
							</Col>
						</Row>)
				}) : <Row className="justify-content-center"><Col>{t("CredentialsSessionCard|No active sessions")}</Col></Row>}
			</CardBody>
			<CardFooter>
				<ButtonWithAuthz
					title={t("CredentialsSessionCard|Terminate user sessions")}
					id={props.credentials_id}
					color="danger"
					outline
					onClick={() => {terminateSessionsForm()}}
					resource="authz:superuser"
					resources={props.resources}
					disabled={data.length == 0}
				>
					{t("CredentialsSessionCard|Terminate sessions")}
				</ButtonWithAuthz>
			</CardFooter>
		</Card>
	)
}

export default CredentialsSessionCard;
