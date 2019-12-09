import React, { Component } from 'react';
import CsvMappingColumns from '.././logger/CsvMappingColumns';
import {getPrograms, getAttributes} from '.././api/API';
import { Button, ButtonStrip, Menu, SplitButton, MenuItem, Card, Modal, CircularLoader } from '@dhis2/ui-core';


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
        let filePreview
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
                {filePreview}
            </div>
        );
    }


}


export default ImportPreview;