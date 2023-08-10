import {useTranslation} from "react-i18next";
import {Button, FormFeedback, FormGroup, Input, InputGroup, InputGroupAddon, Label} from "reactstrap";
import {Controller} from "react-hook-form";
import React from "react";

export default function CustomDataInput ({name, control, errors, append, remove, fields, replace, labelName}) {
	const { t } = useTranslation();

	return (
		<FormGroup>
			{labelName && <Label for={name} title={name}>{labelName}</Label>}
			{fields && fields.map((item, idx) => {
				if (fields[idx].key === "undefined") {
					return
				}
				return (
					<InputGroup key={item.id} className="mb-1 custom-data" >
						<div className="custom-data-key" >
							<Controller
								render={({field}) => <Input {...field} invalid={errors[name]?.[idx]?.key}/>}
								name={`${name}[${idx}].key`}
								control={control}
								rules={{
									validate: {
										val: value => (/^[a-zA-Z][a-zA-Z0-9_-]{0,126}[a-zA-Z0-9]$|^$/).test(value) || t("CustomDataContainer|Invalid format"),
									}
								}}
							/>
							{errors[name]?.[idx]?.key && <FormFeedback>{errors[name]?.[idx]?.key?.message}</FormFeedback>}
						</div>
						<div className="custom-data-value">
							<Controller
								render={({field}) => <Input {...field} invalid={errors[name]?.[idx]?.value}/>}
								name={`${name}[${idx}].value`}
								control={control}
							/>
						</div>
						<InputGroupAddon addonType="append" className="custom-data-remove-button" >
							<Button
								key={idx}
								title={(fields.length === 1) && (fields[0].key === "") ? t("CustomDataContainer|Nothing to remove") : t("CustomDataContainer|Remove input")}
								color="danger"
								outline
								size="sm"
								disabled={(fields.length === 1) && ((fields[0].key === ""))} // Disable button if he number of inputs is 1  and no text added
								onClick={() => {(fields.length === 1) ? replace({key: '', value: ''}) : remove(idx)}}
							>
								<span className="at-minus-circle" />
							</Button>
						</InputGroupAddon>
					</InputGroup>
				);
			})}
			<Button
				className="mt-2"
				title={t("CustomDataContainer|Add new input")}
				color="primary"
				outline
				size="sm"
				type="button"
				onClick={() => {append({key: '', value: ''})}}
			>
				<span className="at-plus-circle" />
			</Button>
		</FormGroup>
	)
}
