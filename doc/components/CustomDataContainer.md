# CustomDataContainer


`CustomDataContainer` renders a plug'n'play custom data card.


## Props:


	- `app`

	- `resources`: array, of credential's resources - used for ButtonWithAuthz granting option to edit Custom data

	- `customData`: object, containing data provided by api

	- `setCustomData`: function managing customData's state in parent component

	- `loading`: boolean, comming from the parent component deciding whether the data has already been fetched or not. if false, displays content loader

	- `resource`: string, resource granting option to edit CustomData

	- `uri`: string, SeaCatAuths API endpoint do save edited data. should be in format 'credentials/mongodb:JJ68' for unification, avoid passing '/credentials/mongodb:JJ68' with slash as the first character


## Example:

```
import React from 'react';
import { CustomDataContainer } from '../components/CustomDataContainer';

const YourComponent = (props) => {

		...

		return (
			<>

				...

					<CustomDataaContainer
						resources={resources}
						customData={customCredentialData}
						setCustomData={setCustomCredentialData}
						app={props.app}
						loading={loadingCustomData}
						uri={`path/to/${success}`}
					/>
			</>
		)
	}
```
