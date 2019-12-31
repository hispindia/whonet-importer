import React, { Component } from 'react';
import CsvMappingColumns from '.././logger/CsvMappingColumns';
import {getPrograms, getAttributes} from '.././api/API';

class ImportPreview extends Component {
    constructor(props) {
        super(props);
        this.state = {
           filePreview: undefined, 
           attributes: '',
           dataElements: '',
        };
    }


    async componentWillMount() {
        await getPrograms().then((response) => {
            if (typeof response !== 'undefined') {
                this.setState({
                    dataElements: response.data.programs[0].programStages[0].programStageDataElements
                })
            }
        })
        await getAttributes().then((response) => {
            if (typeof response !== 'undefined') {
                this.setState({
                    attributes: response.data.trackedEntityAttributes
                })
            }
        })
    }


    render() {
        let filePreview, eventDateMessage, deMessage, attrMessage;

          if (this.props.dtNotFoundStatus && (typeof this.props.eventDate === 'undefined' || this.props.eventDate.length === 0)) {
            eventDateMessage = <p className="datastoreKeyNF"> Sorry, datastore event date format is invalid! Please map the sample collection date from left side change mapping. </p>;

          } 
          if(this.props.dtNotFoundStatus && (typeof this.props.requiredColumnsDe === 'undefined' || this.props.requiredColumnsDe.length === 0)) {
            deMessage = <p className="datastoreKeyNF">Sorry, datastore required elements are missing! Please add the required elements uid in datastore 'requiredFields' key as "reqElements": [ "elements UID" ].</p>;

          } 
          if(this.props.dtNotFoundStatus && (typeof this.props.requiredColumnsAtt === 'undefined' || this.props.requiredColumnsAtt.length === 0)) {

            attrMessage = <p className="datastoreKeyNF">Sorry, datastore required attributes are missing! Please add the required attributes uid in datastore 'requiredFields' key as "reqAttributes": [ "attribute UID" ].</p>;
          }
        
        if (this.props.importFile!==undefined) {
            filePreview = <CsvMappingColumns 
              csvData={this.props.importFile.data[0]} 
              settingType={this.props.importFileType} 
              orgUnitId={this.props.orgUnitId} 
              attributes={this.state.attributes}
              dataElements={this.state.dataElements}/>           
        }
        else {
            filePreview = <p className='emptyFilePreviewText'>Please select a file</p>
        }
        return (
            <div className="importPreview">
                {eventDateMessage}
                {deMessage}
                {attrMessage}
                {filePreview}
            </div>
        );
    }


}


export default ImportPreview;