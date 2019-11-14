import React from 'react';
import PropTypes from 'prop-types';
import WhonetController from '../../controllers/WhonetController';
import 'regenerator-runtime/runtime';
import { Card, Modal, Button, Radio } from '@dhis2/ui-core';
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
				settingType='multiLab' orgUnitId={this.state.userOrgUnitId} 
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
      		<div>
				{this.state.modal}
				<div>
					<div className="treeBox">
						<p>Organization Unit</p>
						<OrgUnitTree onSelect={this.handleOrgUnitSelect} onError={this.handleTreeError} className="orgUnitTreeSpace"/>
					</div>
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
					<Button className='sidebarButton' small onClick={this.handleMappingSettings} >Change mapping</Button>					
					<div className='fileBox'>
						
					</div>
					<FilePicker 
						importFileType={this.state.importFileType} 
						handleFilePick = {this.props.handleFilePick}
					/>
					<Button className='sidebarButton' small onClick={this.handleHelpModal} >Help</Button>					
				</div>
				{/*<WhonetController 
				  	importFileType={this.state.importFileType} 
				  	d2={this.props.d2} 
				  	orgUnitId={this.state.userOrgUnitId} 
				  	orgUnit={this.state.userOrgUnitName}
				/>*/}
      		</div>
		)
	}
}


Sidebar.propTypes = {
    d2: PropTypes.object.isRequired,
}
