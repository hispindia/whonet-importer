import React from 'react';
import PropTypes from 'prop-types';
import WhonetController from '../../controllers/WhonetController';
import 'regenerator-runtime/runtime';
import { Modal, Button, Radio } from '@dhis2/ui-core';
import '../../style/dhis2UiStyle.css';
import { OrgUnitTree } from '@hisp-amr/org-unit-tree';
import HelpModal from '../../components/settings/HelpModal';
import MappingModal from '../settings/MappingModal';

export default class Sidebar extends React.Component {
	state = {
      	userOrgUnitId  : [],
		userOrgUnitName: '',
		feedBackToUser: '',
		importFileType: 'whonet',		
	}		
	

	handleOrgUnitSelect = ({id, displayName}) => {
		this.setState({userOrgUnitId : id, userOrgUnitName: displayName})
	}


	handleMappingSettings = () => {
		if (this.state.importFileType === 'whonet') {
			this.setState({feedBackToUser: 
				<MappingModal isModalOpen='true' handleModal={this.handleSettingModal} 
				settingType="whonet" /> })
		}
		else {
			this.setState({feedBackToUser: 
				<MappingModal isModalOpen='true' handleModal={this.handleSettingModal} 
				settingType='lab' orgUnitId={this.state.userOrgUnitId} 
				orgUnitName={this.state.userOrgUnitName} />})	
		}
	}


	handleSettingModal = () => {
		this.setState({
		  feedBackToUser: '',
		})
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
					<div className="treeBox">
						<p>Organization Unit</p>
						<OrgUnitTree onSelect={this.handleOrgUnitSelect} onError={this.handleTreeError} className="orgUnitTreeSpace"/>
					</div>
					<p>Mapping</p>
					<div className='mappingRadioButtons'>
					<Radio 
						className='leftRadioButton'
						label="Whonet" 
						onChange={() => this.setState({importFileType: 'whonet'})} 
						value="whonet" 
						checked={this.state.importFileType==='whonet'}
						/>
					<Radio
						label="Lab"
						onChange={() => this.setState({importFileType: 'lab'})} 
						value="lab"
						checked={this.state.importFileType==='lab'}
					/> 
					</div>
					<Button className='sidebarButton' small onClick={this.handleMappingSettings} >Change mapping</Button>					
					<div className='fileBox'>
						
					</div>
					<Button className='sidebarButton' small onClick={this.handleHelpModal} >Help</Button>					
				</aside>
				<WhonetController 
				  	importFileType={this.state.importFileType} 
				  	d2={this.props.d2} 
				  	orgUnitId={this.state.userOrgUnitId} 
				  	orgUnit={this.state.userOrgUnitName}
				/>
      		</div>
		)
	}
}


Sidebar.propTypes = {
    d2: PropTypes.object.isRequired,
}
