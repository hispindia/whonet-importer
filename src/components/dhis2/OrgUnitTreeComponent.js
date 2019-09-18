import React from 'react';
import PropTypes from 'prop-types';
import WhonetController from '../../controllers/WhonetController';
import 'regenerator-runtime/runtime';
import { Card } from '@dhis2/ui-core';
import '../../style/dhis2UiStyle.css';
import { OrgUnitTree } from '@hisp-amr/org-unit-tree';


export default class OrgUnitTreeComponent extends React.Component {
	state = {
      	userOrgUnitId  : [],
      	userOrgUnitName: '',
	}		
	

	handleOrgUnitSelect = ({id, displayName}) => {
		this.setState({userOrgUnitId : id, userOrgUnitName: displayName})
	}


	render () {
		return (
      		<div className="pageContainer">
				<Card className="orgUnitTreeCard">
						<OrgUnitTree onSelect={this.handleOrgUnitSelect}/>
				</Card>
          		<WhonetController d2={this.props.d2} orgUnitId={this.state.userOrgUnitId} orgUnit={this.state.userOrgUnitName}/>
      		</div>
		)
	}
}


OrgUnitTreeComponent.propTypes = {
    d2: PropTypes.object.isRequired,
}
