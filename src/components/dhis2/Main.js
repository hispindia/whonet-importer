import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Sidebar from './Sidebar';
import ImportPreview from './ImportPreview';
import { Button, Modal, ButtonStrip } from '@dhis2/ui-core';
import Papa from 'papaparse';
import {
    getPrograms,
    getAttributes,
    getAttributeDetails,
    isDuplicate,
    createTrackedEntity,
    checkOrgUnitInProgram,
    getOrgUnitDetail,
    generateAmrId,
    getDataStoreNameSpace,
    getElementDetails,
    getOptionDetails,
    getOptionSetDetails,
  } from '../api/API';
  import {uploadCsvFile} from '../helpers/UploadCsvFile';


class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            importFile: undefined,
            orgUnitId: '',
            orgUnitName: '',
            feedBackToUser: '',
            importFileType: 'whonet',
            csvfile: undefined,
        };
    }


    handleFileUpload = (file) => {
		this.setState({importFile: file})
    }


    setImportFileType = (fileType) => {
        this.setState({importFileType: fileType})
    }

    
    setOrgUnit = (orgUnitId, orgUnitName) => {
        this.setState({orgUnitId: orgUnitId, orgUnitName: orgUnitName})
    }


    giveUserFeedback = (feedback) => {
        this.setState({
          feedBackToUser:
            <Modal small open>
              <Modal.Content> {feedback} </Modal.Content>
              <Modal.Actions><Button onClick={() => this.setState({ feedBackToUser: '' })}>Close</Button></Modal.Actions>
            </Modal>
        });
    }


    setImportFileType = (fileType) => {
        this.setState({importFileType: fileType})
        console.log("Settting importFileType: " + fileType)
    }


    fileUploadPreAlert = () => {
        if (typeof this.props.orgUnitId === 'undefined' || this.props.orgUnitId === null || this.props.orgUnitId === '') {
          this.giveUserFeedback('Please select an org. unit')
        } else if (typeof this.state.importFile === 'undefined') {
          this.giveUserFeedback('Please select a file')
        }  
        else {
            this.setState({
              feedBackToUser:
                <Modal small open>
                  <Modal.Content>Are you sure you want to upload <i>{this.state.importFile.name}</i> ?</Modal.Content>
                  <Modal.Actions>
                    <ButtonStrip>
                      <Button secondary onClick={() => this.setState({ feedBackToUser: '' })}>Cancel</Button>
                      <Button primary onClick={this.handleFileUpload}>Yes</Button>
                    </ButtonStrip>
                  </Modal.Actions>                
                </Modal>
            });
        }
      }

        
    handleFileUpload = () => {
        this.setState({ feedBackToUser: ''});
        checkOrgUnitInProgram(this.props.orgUnitId).then(async result => {
            if (typeof result !== 'undefined' && result.length > 0) {
                this.setState({
                    loading: true
                })
                await uploadCsvFile(this.state.importFile, this.state.orgUnitId, this.state.importFileType).then((response) => {
                    console.log("reponse: " + response)
                });
            } 
            else {
                this.giveUserFeedback('File upload failed. Your selected org. unit was not assigned to this program')
            }
        });
    }


    handleFilePick = (file) => {
        this.setState({importFile: file})
    }
    

    render() {
        return (
            <div className='pageContainer'>
                <aside className='sideBar'>
                <Sidebar handleFilePick={this.handleFilePick} setImportFileType={this.setImportFileType} d2={this.props.d2} setOrgUnit={this.props.setOrgUnit} setImportFileType={this.setImportFileType}/>
                <Button type='button' onClick={this.fileUploadPreAlert} primary disabled={this.state.importFile===undefined}>Import</Button>
                </aside>
                <div className='previewBox'>
                    <ImportPreview importFile={this.state.importFile} orgUnitId={this.state.orgUnitId} importFileType={this.state.importFileType}/>
                </div>
                {this.state.feedBackToUser}                
            </div>
        );
    }
}


export default Main;
