import React, { Component } from 'react';
import { Button } from '@dhis2/ui-core';
import Papa from 'papaparse';
import {
  checkOrgUnitInProgram, 
  getDataStoreNameSpace,
  getMultipleElements,
  getMultipleAttributes,
  createDateStoreNameSpace, 
} from '../api/API';
import { Modal } from '@dhis2/ui-core';
class FilePicker extends Component {
    constructor(props) {
        super(props);
        this.state = {
        csvfile: undefined,        
        programAssignedStatus: false,
        disabled: true,
        requiredColumnsDe: [],
        requiredColumnsAtt: [],
        requiredColumnsDeValue: [],
        requiredColumnsAttValue: [],
        requiredFieldsDSStatus: false,
        requiredFieldsDSMessage: "",
      };
    }

    async componentDidMount() {
      
      // Get required fields from namespace
      await getDataStoreNameSpace("requiredFields").then((response) => {
        this.setState({
          eventDate : response.data.eventDate,      
          requiredColumnsDe : response.data.reqElements,      
          requiredColumnsAtt : response.data.reqAttributes,      
        }); 
      }).catch( error =>{

        // If no namespace is found then create 
        if (error.response.data.httpStatusCode == 404 ) {
          createDateStoreNameSpace('api/dataStore/whonet/requiredFields', JSON.stringify({"eventDate": [],"reqElements": [],"reqAttributes": []})).then(info=>{
            // this.props.giveUserFeedback(info.data);
            console.log("Info: ", info.data);
          });

        } else {
          // this.props.giveUserFeedback("Failed to create namespace!");
        }  
      });

      // Required mapping message in alert box in window load
      this.requiredFields().then((value)=>{
        let requiredVal = value.map( (data, i) =>{
            if (typeof data.code == 'undefined') return <li key={i}> Mapping is required for {data.name}</li>
          });
        requiredVal.map((info)=>{
          if (typeof info !== 'undefined') {
            // this.props.giveUserFeedback(requiredVal)
          }
        })  
   
      }); // End of required alert
    }

    /**
    * @required datastore value - { "eventDate": ["eventDate"], "reqElements": ["SaQe2REkGVw","mp5MeJ2dFQz"],"reqAttributes": ["nFrlz82c6jS"]} //Patient ID, Sample collection date, Organism name, Sample type 
    * @requiredColumnsDeValue - store the required data elements name and code
    * @requiredColumnsAttValue - store the required attributes name and code
    * @messaageArr - returns missing mapped code list
    */
    async requiredFields() {

      let eventMessage = new Array();
      let deMessage   = new Array();
      let messaageArr = new Array();

      try {       

        // Missing event date alert
        if (this.state.eventDate.length === 0 ) {  
          eventMessage = [{name: "Event date"}];
        }
   
        // Missing required data in data store, if the required fields mapping is empty in data store
        if (this.state.eventDate[0] == 'undefined' || this.state.eventDate.length == 0) {
          this.setState({
            requiredFieldsDSStatus: true,
            requiredFieldsDSMessage : "Sorry, datastore event date format is invalid! Please map the sample collection date from left side change mapping.",

          });  
        } else if(this.state.requiredColumnsDe.length == 0 ) {
         this.setState({
            requiredFieldsDSStatus: true,
            requiredFieldsDSMessage : "Sorry, datastore required elements are missing! Please add the required elements uid in datastore 'requiredFields' key.",

          });
        } else if (this.state.requiredColumnsAtt.length == 0 ) {
          this.setState({
            requiredFieldsDSStatus: true,
            requiredFieldsDSMessage : "Sorry, datastore required elements are missing! Please add the required attributes uid in datastore 'requiredFields' key.",

          }); 
        }

        // this.props.dataStoreNamespaceCheckCallback(this.state.requiredFieldsDSStatus, this.state.requiredFieldsDSMessage);
        // Missing elements alert
        await getMultipleElements(this.state.requiredColumnsDe).then((response) => {
          // deMessage = [...response.data.dataElements];
          deMessage.push(...response.data.dataElements);
          // deMessage = eventMessage.concat(response.data.dataElements);
          this.setState({
            // disableImportButton: true,
            requiredColumnsDeValue: response.data.dataElements
          });      
        });

        //Missing attributes alert
        await getMultipleAttributes(this.state.requiredColumnsAtt).then((response) => {
          messaageArr = deMessage.concat(response.data.trackedEntityAttributes);
          this.setState({
            // disableImportButton: true,
            requiredColumnsAttValue: response.data.trackedEntityAttributes
          });      
        });

        // Call back to main component
        this.props.callbackRequiredColumnsAtt(this.state.requiredColumnsAttValue, this.state.eventDate[0]);

      } catch (err) {
        console.log(err);
      }
      
      return messaageArr;
    }

    /**
    * @requiredImportFileHeader() finds the missing columns from the import file
    * @mappingMessageArr-Array contains the mapped columns 
    * @requiredColsArr-Array contains the all required fileds from datastore for data elements, attributes and event date, it has merged the datastore configuration for required fields
    * 
    */
    async requiredImportFileHeader(csvData){

      let mappingMessageArr = new Array();
      let requiredColsArr   = new Array();
      let dataELResArr  = this.state.requiredColumnsDeValue;
      let dataAttResArr = this.state.requiredColumnsAttValue;

      let margedArrDe = dataELResArr.concat(dataAttResArr);
      if(typeof this.state.eventDate !== 'undefined'){
        requiredColsArr = margedArrDe.concat([{name: "Event Date" ,code: this.state.eventDate[0]}]);
        // Iterate and check the CSV file
        Object.entries(csvData[0]).map( (value, key) =>{
          let splittedValue  = value[0].split(","); // remove the C,2 or C,6 portion
          let csvColumnName  = splittedValue[0];
            // Check elements 
            dataELResArr.filter(function(element) {   
              if(element.code === csvColumnName){
                mappingMessageArr.push(element);
              }                          
            });

            // Check attributes
            dataAttResArr.filter(function(attribute) {   
              if(attribute.code === csvColumnName){              
                mappingMessageArr.push(attribute);
              }                          
            });

            // Check event date
            if(this.state.eventDate[0] === csvColumnName){
                mappingMessageArr.push({name: "Event Date", code: this.state.eventDate[0]});
            }
        });

      // Compare two arrays-required columns and csv mapped     
        function comparer(otherArray){
          return function(current){
            return otherArray.filter(function(other){            
              return other.code === current.code            
            }).length == 0;
          }
        }
        // console.log({requiredColsArr})
        // console.log({mappingMessageArr})

      // Find missing columns
        let requiredColsArrResult   = requiredColsArr.filter(comparer(mappingMessageArr));
        let mappingMessageArrResult = mappingMessageArr.filter(comparer(requiredColsArr));
        let resultMissingColumn     = requiredColsArrResult.concat(mappingMessageArrResult);

        if (resultMissingColumn.length > 0) {

          this.props.giveUserFeedback( resultMissingColumn.map((value, index)=>{return <li key={index}> Missing {value.name} column in the selected file!</li>}) );
          this.setState({
            disabled: true, // Import button 
          });  

        } else {
          this.setState({
            disabled: false, 
          });  
        }// End of missing columns check 
      }              
        
    }
    handleChangeFilePick = (event) => {     

        /**
        * Selected file format checking
        * Accept only .csv file format
        * Update setter 
        */
        if (typeof event.target.files[0] !== 'undefined') {
          this.setState({ feedBackToUser: '' });
          // Check the org unit assigned or not and return the status as callback function
          checkOrgUnitInProgram(this.props.orgUnitId).then(result => {

            if (typeof result == 'undefined') {
              this.setState({
                programAssignedStatus: true, // Not assigned
              });
            } else {
              this.setState({
                programAssignedStatus: false,
              });
            }
            // Call back to sidebar component
            this.props.callbackFromFilePicker(this.state.programAssignedStatus, this.state.disabled);
          });

          let fileType = this.props.importFileType; 
          let filename = event.target.files[0].name;
          let splittedName = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
          if (fileType === ''){
            this.props.giveUserFeedback("Please select your import file type. "); 
          } else if (splittedName !== 'csv') {

            this.props.giveUserFeedback("Sorry! Please upload correct file format! Accepted file fortmat is CSV. Your selected file name: " + event.target.files[0].name + " Last Modified: " + event.target.files[0].lastModified + " Size: " + event.target.files[0].size + " File type: " + event.target.files[0].type);

          } else {

            this.setState({
              csvfile: event.target.files[0],
              fileFormatValue: splittedName
            });

            if (!(typeof this.props.orgUnitId === 'undefined' || this.props.orgUnitId === null || this.props.orgUnitId === '')) {

              this.setState({
                programAssignedStatus: false, // Enable the import button because the selected org unit is now assigned
              });
            }
            Papa.parse(event.target.files[0], {
              complete: this.props.handleFilePick,
              header: true,
              skipEmptyLines: true,
            });

            // Required file column check
            Papa.parse(event.target.files[0], {
              complete: this.handleFileRequiredFields,
              header: true,
              skipEmptyLines: true,
            }); 
          }  
        }
    }

    handleFileRequiredFields = (input) => {
      this.requiredImportFileHeader(input.data);      
    }  


    render() {
        
        return (

          <div>
            <input
            className="fileInput"
            type="file"
            ref={input => {
                this.filesInput = input;
            }}
            name="file"
            placeholder={null}
            onChange={this.handleChangeFilePick}
            accept=".csv"
            />
          </div>  
        );
    }
}


export default FilePicker;