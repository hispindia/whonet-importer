import React, { Component } from 'react';
import { Button } from '@dhis2/ui-core';
import Papa from 'papaparse';


class FileImport extends Component {
    constructor(props) {
        super(props);
        this.state = {
           csvfile: undefined,
        };
    }


    handleChangeFileUpload = (event) => {
        /**
        * Selected file format checking
        * Accept only .csv file format
        * Update setter 
        */
        if (typeof event.target.files[0] !== 'undefined') {
          let fileType = this.props.importFileType; 
          let filename = event.target.files[0].name;
          let splittedName = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
          if (fileType === ''){
            this.giveUserFeedback(" Please select your import file type. "); 
          } else if (splittedName !== 'csv') {
            this.giveUserFeedback("Sorry! Please upload correct file format! Accepted file fortmat is CSV. Your selected file name: " + event.target.files[0].name + " Last Modified: " + event.target.files[0].lastModified + " Size: " + event.target.files[0].size + " File type: " + event.target.files[0].type);
          } else {
            this.setState({
              csvfile: event.target.files[0],
              fileFormatValue: splittedName
            });
            /**
            * @{generateCsvMappingTable} returns the parsed records of selected csv file
            */
            Papa.parse(event.target.files[0], {
              complete: this.generateCsvMappingTable,
              header: true
            });
            console.log("Your selected file: ", event.target.files[0].name);
          }  
        }
        this.props.handleFileUpload(this.csvfile)
      }


    render() {
        return (
            <input
            className="fileInput"
            type="file"
            ref={input => {
                this.filesInput = input;
            }}
            name="file"
            placeholder={null}
            onChange={this.handleChangeFileUpload}
            accept=".csv"
            />
        );
    }
}


export default FileImport;