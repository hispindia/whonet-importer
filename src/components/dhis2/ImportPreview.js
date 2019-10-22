import React, { Component } from 'react';
import { Button, ButtonStrip, Menu, SplitButton, MenuItem, Card, Modal, CircularLoader } from '@dhis2/ui-core';


class ImportPreview extends Component {
    constructor(props) {
        super(props);
        this.state = {
           
        };
    }


    fileUploadPreAlert = () => {
        if (typeof this.props.orgUnitId === 'undefined' || this.props.orgUnitId === null || this.props.orgUnitId === '') {
          this.giveUserFeedback('Please select an org. unit')
        } else if (typeof this.state.csvfile === 'undefined') {
          this.giveUserFeedback('Please select a file')
        } 
        else if (this.state.fileFormatValue !== 'csv') {
          this.giveUserFeedback('This file does not have a valid file format. The valid file format is csv.')
        } 
        else {
            this.setState({
              feedBackToUser:
                <Modal small open>
                  <Modal.Content>Are you sure you want to upload this file?</Modal.Content>
                  <Modal.Actions>
                    <ButtonStrip>
                      <Button onClick={() => this.setState({ feedBackToUser: '' })}>Cancel</Button>
                      <Button primary onClick={this.handleFileUpload}>Yes</Button>
                    </ButtonStrip>
                  </Modal.Actions>                
                </Modal>
            });
        }
      }


    render() {
        return (
            <div>
                <h1>Hei</h1>
                <Button type='button' onClick={this.fileUploadPreAlert} primary disabled={this.props.importFile==='undefined'}>Import</Button>
            </div>
        );
    }
}


export default ImportPreview;