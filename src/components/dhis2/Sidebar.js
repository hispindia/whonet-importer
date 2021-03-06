import React from 'react';
import PropTypes from 'prop-types';
import WhonetController from '../../controllers/WhonetController';
import 'regenerator-runtime/runtime';
import { Card, Modal, Button, Radio, Divider } from '@dhis2/ui-core';
import '../../style/dhis2UiStyle.css';
import { OrgUnitTree } from '@hisp-amr/org-unit-tree';
import HelpModal from '../../components/settings/HelpModal';
import MappingModal from '../settings/MappingModal';
import * as config from '../../config/Config';
import FilePicker from './FilePicker';


export default class Sidebar extends React.Component {
	state = {
      	userOrgUnitId  : [],
		userOrgUnitName: '',
		modal: '',
		importFileType: 'whonet',		
	}		
	

	handleOrgUnitSelect = ({id, displayName}) => {
		this.setState({userOrgUnitId : id, userOrgUnitName: displayName})
		console.log("Setting orgUnit: " + displayName + " and org unit id: " + id)
		this.props.setOrgUnit(id, displayName)
	}


	handleMappingSettings = () => {
		if (this.state.importFileType === 'whonet') {
			this.setState({modal: 
				<MappingModal isModalOpen='true' handleModal={this.handleSettingModal} 
				settingType="whonet" /> })
			this.props.setImportFileType('whonet')
		}
		else {
			this.setState({modal: 
				<MappingModal isModalOpen='true' handleModal={this.handleSettingModal} 
				settingType='lab' orgUnitId={this.state.userOrgUnitId} 
				orgUnitName={this.state.userOrgUnitName} />})	
			this.props.setImportFileType('multiLab')			
		}
	}


	handleSettingModal = () => {
		this.setState({
		  modal: '',
		})
	}

	
	handleHelpModal = () => {
		if (this.state.modal === '') {
			this.setState({
				modal: <HelpModal open handleModal={this.handleHelpModal} />
			})
		}
		else {
			this.setState({modal: ''})
		}
	}


	handleTreeError = () => {
		this.setState({
			modal:
			  <Modal small open>
				<Modal.Content>Org. unit tree would not load. </Modal.Content>
				<Modal.Actions><Button onClick={() => this.setState({ modal: '' })}>Close</Button></Modal.Actions>
			  </Modal>
		});
	}


	handleImportFileType = (type) => {
		this.setState({importFileType: type})
		this.props.setImportFileType(type)
	}


	render () {
		return (
      		<div className='sideBar'>
				{this.state.modal}
				<p className="text">Organization Unit</p>
				<div className="treeBox">
					<OrgUnitTree onSelect={this.handleOrgUnitSelect} onError={this.handleTreeError} className="orgUnitTreeSpace"/>
				</div>
				<Divider/>
				<div className="mappingBox">
					<p>Mapping</p>
					<div className='mappingRadioButtons'>
						<Radio 
						className='leftRadioButton'
						label="Whonet" 
						//onChange={() => this.setState({importFileType: 'whonet'})} 
						onChange={() => this.handleImportFileType('whonet')}
						value="whonet" 
						checked={this.state.importFileType==='whonet'}
						/>
						<Radio
						label="Lab"
						//onChange={() => this.setState({importFileType: 'lab'})} 
						onChange={() => this.handleImportFileType('lab')}						
						value="lab"
						checked={this.state.importFileType==='lab'}
						/>
					</div>
					<Button small onClick={this.handleMappingSettings} >Change mapping</Button> 						
				</div>
				<Divider/>					
				<div className='fileBox'>
					<p>File</p>
					<FilePicker 
						importFileType={this.state.importFileType} 
						handleFilePick = {this.props.handleFilePick}
					/>
				</div>
				<Divider/>
				<Button small primary className='importButton' onClick={this.props.fileUploadPreAlert} disabled={this.props.disabled}>Import</Button>
				<Button small secondary className='helpButton' onClick={this.handleHelpModal} >Help</Button>						
      		</div>
		)
	}
}


Sidebar.propTypes = {
    d2: PropTypes.object.isRequired,
}
