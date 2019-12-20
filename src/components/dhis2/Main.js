import React, { Component } from 'react';
// import PropTypes from 'prop-types';
import Sidebar from './Sidebar';
import ImportPreview from './ImportPreview';
import ImportResults from './../import-results/ImportResults';
import { Button, Modal, ButtonStrip, AlertBar, AlertStack, CircularLoader } from '@dhis2/ui-core';
// import Papa from 'papaparse';
import { 
  checkOrgUnitInProgram,
  getAttributes,
  getPrograms,
} from '../api/API';
import {uploadCsvFile} from '../helpers/UploadCsvFile';


class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            importFile: undefined,
            orgUnitId: '',
            orgUnitName: '',
            feedbackToUser: '',
            importFileType: 'whonet',
            csvfile: undefined,
            requiredColumnsAttValue: [],
            dataElements: [],
            attributes: [],
            eventDate: "",
            teiResponse: [],
            teiResponseString: "",
            eventResponse: [],
            eventResponseString: "",
            importResult: false,
            loading: false,
            eventDate: [], 
            requiredColumnsDe:[],
            requiredColumnsAtt:[],
            namespaceNotfoundMessage: false,
        };
        
    }
    async componentDidMount() {
      // List of all data elements
      let self = this;
      await getPrograms().then((response) => {
        if (typeof response !== 'undefined') {
          self.setState({
            dataElements: response.data.programs[0].programStages[0].programStageDataElements
          });
        }

      });

      // List of all attributes
      await getAttributes().then((response) => {
        if (typeof response !== 'undefined') {
          self.setState({
            attributes: response.data.trackedEntityAttributes
          });
        }
      });
    }
    handleFileUpload = (file) => {
		  this.setState({importFile: file})
    }

    /*setImportFileType = (fileType) => {
        this.setState({importFileType: fileType})
    }*/
    
    setOrgUnit = (orgUnitId, orgUnitName) => {
        this.setState({orgUnitId: orgUnitId, orgUnitName: orgUnitName})
        this.props.setOrgUnit(orgUnitId, orgUnitName)
    }

    giveUserFeedback = (feedback) => {
        this.setState({
          feedbackToUser:
            <Modal small open>
              <Modal.Content> {feedback} </Modal.Content>
              <Modal.Actions><Button onClick={() => this.setState({ feedbackToUser: '' })}>Close</Button></Modal.Actions>
            </Modal>
        });
    }

    setImportFileType = (fileType) => {
      this.setState({importFileType: fileType})
    }

    fileUploadPreAlert = () => {

        if (typeof this.props.orgUnitId === 'undefined' || this.props.orgUnitId === null || this.props.orgUnitId === '') {
          this.giveUserFeedback('Please select an org. unit')
        } else if (typeof this.state.importFile === 'undefined') {
          this.giveUserFeedback('Please select a file')
        } else {
            this.setState({
              feedbackToUser:
                <Modal small open>
                  <Modal.Content>Are you sure you want to upload <i>{this.state.importFile.name}</i> ?</Modal.Content>
                  <Modal.Actions>
                    <ButtonStrip>
                      <Button secondary onClick={() => this.setState({ feedbackToUser: '' })}>Cancel</Button>
                      <Button primary onClick={this.handleFileUpload}>Yes</Button>
                    </ButtonStrip>
                  </Modal.Actions>                
                </Modal>
            });
        }
    }
        
    handleFileUpload = () => {
        this.setState({ feedbackToUser: ''});
        checkOrgUnitInProgram(this.props.orgUnitId).then(async result => {
            if (typeof result !== 'undefined' && result.length > 0) {
                this.setState({
                    loading: true
                })

                await uploadCsvFile(this.state.importFile, this.state.orgUnitId, this.state.importFileType, this.state.requiredColumnsAttValue, this.state.dataElements, this.state.attributes, this.state.eventDate).then((response) => {
                    //console.log("Response from uploadCsvFile: " + JSON.stringify(response))
                    this.setState({
                        teiResponse: response.teiResponse,
                        eventResponse: response.eventResponse,
                        importResult: true,
                        loading: false
                    });
                    this.fileUploadFeedback(response)
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

    fileUploadFeedback = (response) => {
        if (response.error===false) {
            this.setState({feedbackToUser: 
            <AlertStack>
                <AlertBar duration={8000} icon success className="alertBar" onHidden={this.setState({feedbackToUser: ''})}>
                    {response.success}
                </AlertBar>
            </AlertStack>
          })
        }
        else {
            
            this.setState({               
                feedbackToUser:
                <AlertStack>
                    <AlertBar duration={8000} icon critical className="alertBar" onHidden={this.setState({feedbackToUser: ''})}>
                        {response.error}
                    </AlertBar>
                </AlertStack>
            });

        } 
    }    

    dataStoreNamespaceCheck = (eventDate, requiredColumnsDe, requiredColumnsAtt) =>{
      this.setState({
        eventDate, 
        requiredColumnsDe,
        requiredColumnsAtt,
        namespaceNotfoundMessage: true, 
      });
    }

    callbackRequiredColumnsAttValue = (requiredColumnsAttValue, eventDate) =>{
      this.setState({
        requiredColumnsAttValue: requiredColumnsAttValue,
        eventDate: eventDate 
      });
    }

    render() {
        let teiResponse, importPreview, importLoader;
        if (this.state.teiResponse.status === "SUCCESS" || this.state.teiResponse.status === "ERROR") {
          teiResponse = <ImportResults teiResponse={this.state.teiResponse} eventResponse={this.state.eventResponse} />
          // logger = <LoggerComponent teiResponse={this.state.teiResponse} teiResponseString={this.state.teiResponseString} eventResponseString={this.state.eventResponseString}/>
        }

        if (this.state.loading) {
          importLoader = <CircularLoader className='circularLoader'/>
        }

        if (!this.state.importResult) {
          importPreview = <ImportPreview 
                importFile={this.state.importFile} 
                orgUnitId={this.state.orgUnitId} 
                importFileType={this.state.importFileType}
                eventDate = {this.state.eventDate}
                requiredColumnsDe = { this.state.requiredColumnsDe }
                requiredColumnsAtt = { this.state.requiredColumnsAtt } 
                />;
        } else {
          importPreview = teiResponse;
        }

        if (this.state.namespaceNotfoundMessage) {
          importPreview = <ImportPreview 
                eventDate = {this.state.eventDate}
                requiredColumnsDe = { this.state.requiredColumnsDe }
                requiredColumnsAtt = { this.state.requiredColumnsAtt } 
                />;
        }

        return (
            <div className='pageContainer'>
                {importLoader}
                <Sidebar 
                fileUploadPreAlert = {this.fileUploadPreAlert} 
                disabled = {this.state.importFile===undefined} 
                handleFilePick = {this.handleFilePick} 
                setImportFileType = {this.setImportFileType} 
                d2={this.props.d2} 
                setOrgUnit={this.setOrgUnit}
                giveUserFeedback = {this.giveUserFeedback} 
                dataStoreNamespaceCheck = {this.dataStoreNamespaceCheck}
                callbackRequiredColumnsAtt = {this.callbackRequiredColumnsAttValue}
                />
                {importPreview}               
                
                {this.state.feedbackToUser}                                    
            </div>
        );
    }
}


export default Main;
