import React from 'react';
import PropTypes from 'prop-types';
import WhonetController from '../../controllers/WhonetController';
import 'regenerator-runtime/runtime';
import { Card, Modal, Button } from '@dhis2/ui-core';
import '../../style/dhis2UiStyle.css';
import { OrgUnitTree } from '@hisp-amr/org-unit-tree';
import HelpModal from '../../components/settings/HelpModal';


export default class OrgUnitTreeComponent extends React.Component {
	state = {
      	userOrgUnitId  : [],
		userOrgUnitName: '',
		feedBackToUser: '',
	}		
	

	handleOrgUnitSelect = ({id, displayName}) => {
		this.setState({userOrgUnitId : id, userOrgUnitName: displayName})
	}

	
	handleHelpModal = () => {
		if (this.state.feedBackToUser === '') {
			this.setState({
				feedBackToUser: <HelpModal open handleModal={this.handleHelpModal} />
			})
		}
		else {
			this.setState({feedBackToUser: ''})
		}
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
				<aside className="sideBar">
					<OrgUnitTree onSelect={this.handleOrgUnitSelect} onError={this.handleTreeError} className="orgUnitTreeSpace"/>
					<Button small onClick={this.handleHelpModal} >Help</Button>
				</aside>
          		<WhonetController d2={this.props.d2} orgUnitId={this.state.userOrgUnitId} orgUnit={this.state.userOrgUnitName}/>
      		</div>
		)
	}
}


OrgUnitTreeComponent.propTypes = {
    d2: PropTypes.object.isRequired,
}
