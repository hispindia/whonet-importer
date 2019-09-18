import React from 'react';
import PropTypes from 'prop-types';
import WhonetController from '../../controllers/WhonetController';
import 'regenerator-runtime/runtime';
import { Card, Modal, Button } from '@dhis2/ui-core';
import '../../style/dhis2UiStyle.css';
import { OrgUnitTree } from '@hisp-amr/org-unit-tree';


export default class OrgUnitTreeComponent extends React.Component {
	state = {
      	userOrgUnitId  : [],
		userOrgUnitName: '',
		feedBackToUser: '',
	}		
	

	handleOrgUnitSelect = ({id, displayName}) => {
		this.setState({userOrgUnitId : id, userOrgUnitName: displayName})
	}


	handleTreeError = () => {
		this.setState({
			feedBackToUser:
			  <Modal small open>
				<Modal.Content>Org. unit tree would not load. </Modal.Content>
				<Modal.Actions><Button onClick={() => this.setState({ feedBackToUser: '' })}>Close</Button></Modal.Actions>
			  </Modal>
		  });
	}


	render () {
		return (
      		<div className="pageContainer">
			  	{this.state.feedBackToUser}
				<Card className="orgUnitTreeCard">
						<OrgUnitTree onSelect={this.handleOrgUnitSelect} onError={this.handleTreeError}/>
				</Card>
          		<WhonetController d2={this.props.d2} orgUnitId={this.state.userOrgUnitId} orgUnit={this.state.userOrgUnitName}/>
      		</div>
		)
	}
}


OrgUnitTreeComponent.propTypes = {
    d2: PropTypes.object.isRequired,
}
