import React, { useState, useEffect } from "react"
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSelector } from "react-redux";
import { Container, Row, Form,  Card,
	CardBody, CardHeader, CardFooter,
	ButtonGroup, Button, Col} from "reactstrap";

const CredentialsTenantsAssignContainer = (props) => {

	const {t} = useTranslation();
	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

	const [ allTenants, setAllTenants] = useState(undefined);
	const [ assignedTenants, setAssignedTenants] = useState([]);
	const [ assignedCredentialsDropdown, setAssignedCredentialsDropdown ] = useState([]);
	const [ limit, setLimit] = useState(15);
	const [ count, setCount ] = useState(undefined);
	const [ filter, setFilter] = useState('');
	const [ loading, setLoading ] = useState(true);


	const { register, handleSubmit, reset } = useForm({defaultValues: { tenants: assignedTenants }});
	const resources = useSelector(state => state.auth?.resources);

	const credentials_id = props.match.params.credentials_id;

	useEffect(() => {
		fetchAllTenants();
		retrieveUserInfo();
		retrieveAssignedTenants();
	})

	const retrieveUserInfo = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/credentials/${credentials_id}`);
			setCredentialsList([response.data]);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("XXXXXXXXXXX|Something went wrong, failed to fetch user details")}. ${e?.response?.data?.message}`, 30);
		}
	};

	const retrieveAssignedTenants = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/tenant_assign/${credentials_id}`);
			setAssignedTenants(response.data);
			setPrevAssignedTenants(response.data)
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsTenantsAssignCard|Something went wrong, failed to fetch assigned tenants")}. ${e?.response?.data?.message}`, 30);
		}
	};

	const fetchAllTenants = async() => {
		try {
			let eligibleTenants = [];
			let response = await SeaCatAuthAPI.get('/tenants', {params: {f: filter, i: limit}});
			// if a logged in user doesn't hold 'authz:superuser' resource, their rights allow them to only assing the tenant, which they are currently using
			if (resources.includes('authz:superuser')) {
				eligibleTenants = response.data.data;
			} else if (response.data.data.length > 0) {
				let filteredTenant = response.data.data.filter(obj => obj._id === `${tenant}`);
				eligibleTenants.push(filteredTenant[0]);
			}
			// this function changed eligibleTenants order to alphabetical
			eligibleTenants.sort((a, b) => a._id.localeCompare(b._id));
			setAllTenants(eligibleTenants)
			setCount(response.data.count);
		} catch(e) {
			console.error(e);
			// props.app.addAlert("warning", `${t("CredentialsTenantsCard|Something went wrong, failed to fetch tenants")}. ${e?.response?.data?.message}`, 30);
		}
	};

	// Receives data from all credentials
	const retrieveCredentialsForDropdown = async () => {
		setLoading(true);
		let response;
		try {
			response = await SeaCatAuthAPI.get("/credentials", {params: {p:page, i: credentialsLimit, f: filter}});
			if (response.data.result !== "OK") {
				throw new Error(t("CredentialsTenantsAssignContainer|Something went wrong, failed to fetch data"));
			}
			setAssignedCredentialsDropdown(response.data.data);
			setLoading(false)
		} catch(e) {
			console.error(e);
			setLoading(false)
			if (e.response.status === 401) {
				props.app.addAlert("warning", t("CredentialsTenantsAssignContainer|Can't fetch the data, you don't have rights to display it"), 30);
				return;
			}
			props.app.addAlert("warning", `${t("CredentialsTenantsAssignContainer|Something went wrong, failed to fetch data")}. ${e?.response?.data?.message}`, 30);
		}
	};

	const submit = (data) => {
		// TBD
	}

	return (
		<Container>
			<Form onSubmit={handleSubmit(submit)} className="assign-tenants-wraper">
				<Card className='assign-tenants-credentails w-30'>
					<CardHeader>
						<div className="card-header-title">
							<i className="cil-people mr-2" />
							{t("CredentialsTenantsAssignContainer|Credentials")}
						</div>
					</CardHeader>
					<CardBody>
						{ (credentialsList.length > 0) && (
							credentialsList.map((el) => {
								return (
									<div className="card-header-title">
										<i className="cil-user mr-1" />
										{el.username}
									</div>
									)
								}
							))
						}
					</CardBody>
				</Card>
				<Card className="assign-tenants-tenants w-30">
					<CardHeader>
						<div className="card-header-title">
							<i className="cil-apps mr-2" />
							{t("CredentialsTenantsAssignContainer|Assign tenants")}
						</div>
					</CardHeader>

					<CardBody>
						<Col>
						{allTenants && allTenants.length > 0 ?
						allTenants.map((tenant) => {
							return(
								<Row key={tenant._id}>
									<input
										type="checkbox"
										value={tenant._id}
										{...register("tenants")}
									/>
									{tenant._id}
								</Row>
							)
						})
						: <p>{t("CredentialsTenantsAssignContainer|No data")}</p>}
						</Col>
					</CardBody>

					<CardFooter className="border-top">
						<ButtonGroup className="flex-nowrap">
							<Button color="primary" type="submit"> {t("Save")} </Button>
						</ButtonGroup>
					</CardFooter>
				</Card>
			</Form>
		</Container>
	)
}

export default CredentialsTenantsAssignContainer
