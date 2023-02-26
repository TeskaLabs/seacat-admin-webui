import React, { useState, useEffect } from "react"
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSelector } from "react-redux";

const CredentialsTenantsAssignContainer = (props) => {

	const {t} = useTranslation();
    const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

    const [ allTenants, setAllTenants] = useState(undefined);

	const { register, handleSubmit, reset } = useForm({defaultValues: { tenants: assignedTenants }});
    const resources = useSelector(state => state.auth?.resources);

    useEffect(() => {
        fetchAllTenants();
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

    const submit = (data) => {
        // TBD
    }

    return (
        <Container>
			<Form onSubmit={handleSubmit(submit)} className="assign-tenants-wraper">

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
