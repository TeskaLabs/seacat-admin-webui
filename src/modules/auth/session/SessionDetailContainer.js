import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useHistory, Link } from 'react-router-dom';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter, CardBody,
} from 'reactstrap';

import ReactJson from 'react-json-view';
import { DateTime, ButtonWithAuthz, Credentials, DataTable } from 'asab-webui';

function SessionDetailContainer(props) {
	let session_id = props.match.params.session_id;
	const { t } = useTranslation();
	const history = useHistory();
	const [data, setData] = useState({});
	const resource = "seacat:session:terminate";
	const resources = useSelector(state => state.auth?.resources);
	const advmode = useSelector(state => state.advmode?.enabled);
	const theme = useSelector(state => state.theme);

	let SeaCatAuthAPI = props.app.axiosCreate('seacat-auth');

	// Display a modal window with description
	props.app.addHelpButton("https://docs.teskalabs.com/seacat-auth/");

	useEffect(() => {
		retrieveData();
	}, [session_id]);

	const headers = [
		{
			name: t("SessionDetailContainer|Session"),
			key: "_id",
			customComponent: {
				generate: (session) => (
					<Link to={{ pathname: `/auth/session/${session._id}` }}>
						{session._id}
					</Link>
				)
			}
		},
		{
			name: t("Created at"),
			key: "_c",
			datetime: true
		},
		{
			name: t("SessionListContainer|Expected expiration"),
			key: "expiration",
			datetime: true
		},
		{
			name: " ",
			customComponent: {
				generate: (session) => (
					<div className="d-flex justify-content-end">
						<ButtonWithAuthz
							title={t("SessionDetailContainer|Terminate session")}
							id={session._id}
							size="sm"
							color="danger"
							outline
							onClick={() => {terminateSessionForm(session._id)}}
							resource={resource}
							resources={resources}
						>
							<i className="cil-x"></i>
						</ButtonWithAuthz>
					</div>
				)
			}
		}
	]

	const retrieveData = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/session/${session_id}`);
			setData(response.data);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("SessionDetailContainer|Failed to fetch details")}. ${e?.response?.data?.message}`, 30);
		}
	};

	// Set terminate session dialog
	const terminateSessionForm = (sessionId) => {
		var r = confirm(t('SessionDetailContainer|Do you want to terminate this session?'));
		if (r == true) {
			terminateSession(sessionId);
		}
	}

	// Terminate the session
	const terminateSession = async (sessionId) => {
		try {
			let response = await SeaCatAuthAPI.delete(`/session/${session_id}`);
			if (response.data.result !== "OK") {
				throw new Error(t("SessionDetailContainer|Something went wrong when terminating session"));
			}
			props.app.addAlert("success", t("SessionDetailContainer|Session successfully terminated"));
			history.goBack();
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("SessionDetailContainer|Failed to terminate the session")}. ${e?.response?.data?.message}`, 30);
		}
	}

	return (
		<Container className="session-detail-wrapper" fluid>
			<div className="session-info-area">
				<Card>
					<CardHeader className="border-bottom">
						<div className="card-header-title">
							<i className="cil-link pe-2"></i>
							{t("SessionDetailContainer|Session")}
						</div>
					</CardHeader>
					<CardBody>
						<Row>
							<Col md={4}>{t("SessionDetailContainer|Session ID")}</Col>
							<Col style={{overflowX: "auto"}}>
								<code>{data._id?.toString()}</code>
							</Col>
						</Row>

						<Row>
							<Col md={4}>{t("SessionDetailContainer|Credentials ID")}</Col>
							<Col style={{overflowX: "auto"}}>
								{data.credentials_id && <Credentials app={props.app} credentials_ids={[data.credentials_id]}/>}
							</Col>
						</Row>

						<Row>
							<Col md={4}>{t("SessionDetailContainer|Type")}</Col>
							<Col style={{overflowX: "auto"}}>
								<code>{data.type?.toString()}</code>
							</Col>
						</Row>

						{data?.parent_session_id &&
						<Row>
							<Col md={4}>{t("SessionDetailContainer|Parent session ID")}</Col>
							<Col style={{overflowX: "auto"}}>
								<Link
									to={{
										pathname: `/auth/session/${data.parent_session_id}`,
									}}>
									{data.parent_session_id}
								</Link>
							</Col>
						</Row>
						}

						<Row className="mt-3">
							<Col md={4}>{t("Created at")}</Col>
							<Col> {data._c ? <DateTime value={data._c}/> : 'N/A'}</Col>
						</Row>

						<Row>
							<Col md={4}>{t("Modified at")}</Col>
							<Col>{data._m ? <DateTime value={data._m} /> : 'N/A'}</Col>
						</Row>

						<Row>
							<Col md={4}>{t("Expire at")}</Col>
							<Col>{data.expiration ? <DateTime value={data.expiration} /> : 'N/A'}</Col>
						</Row>
					</CardBody>
					<CardFooter>
						<ButtonWithAuthz
							title={t("SessionDetailContainer|Terminate session")}
							id={session_id}
							color="danger"
							outline
							onClick={() => {terminateSessionForm(session_id)}}
							resource={resource}
							resources={resources}
						>
							{t("SessionDetailContainer|Terminate session")}
						</ButtonWithAuthz>
					</CardFooter>
				</Card>
			</div>

			{!data.parent_session_id && data.children &&
				<div className="session-subsession-area">
					<DataTable
						title={{ text: t("SessionDetailContainer|Child sessions"), icon: "cil-link" }}
						headers={headers}
						data={data.children.data}
					/>
				</div>
			}

			<div className="session-authz-area">
				<Card>
					<CardHeader className="border-bottom">
						<div className="card-header-title">
							<i className="cil-link pe-2"></i>
							{t("SessionDetailContainer|Authorization")}
						</div>
					</CardHeader>
					<CardBody>
						<Row>
							<Col md={5} sm={3} xs={4}><span className="authz-heading">{t("SessionDetailContainer|Tenant")}</span></Col>
							<Col className="ps-0" style={{overflowX: "auto"}}><span className="authz-heading">{t("SessionDetailContainer|Resource")}</span></Col>
						</Row>
						{data?.authz && Object.keys(data.authz).map((key, idx) => {
							return(
								<Row key={key} className="pt-2">
									<Col md={5} sm={3} xs={4}>{key.toString()}</Col>
									<Col style={{overflowX: "auto"}}>
										{data.authz[key].map((val, i) => {
											return(
												<Row key={val}>
													{val}
												</Row>
												)
										})}
									</Col>
								</Row>
								)
						})}
					</CardBody>
				</Card>
			</div>

			{advmode &&
				<div className="session-advmode-area">
					<Card className="w-100 mt-2">
						<CardHeader className="border-bottom">
							<div className="card-header-title">
								<i className="cil-code pe-2"></i>
								JSON
							</div>
						</CardHeader>
						{data !== null ?
						<CardBody>
							<ReactJson
								theme={theme === 'dark' ? "chalk" : "rjv-default"}
								src={data}
								name={false}
								collapsed={false}
							/>
						</CardBody>
						: null}
					</Card>
				</div>
			}
		</Container>
	)
}

export default SessionDetailContainer;
