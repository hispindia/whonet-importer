import React from 'react';
import Papa from 'papaparse';
import MappingModal from '../components/settings/MappingModal';
import * as config from '../config/Config';
import * as styleProps from '../components/ui/Styles';
import { formatDate } from '../components/helpers/DateFormat';
import { hash } from '../components/helpers/Hash';
import LoggerComponent from '../components/logger/LoggerComponent';
import CsvMappingColumns from '../components/logger/CsvMappingColumns';
import ImportResults from '../components/import-results/ImportResults';
import { Button, ButtonStrip, Card, Modal, CircularLoader } from '@dhis2/ui-core';
import '../style/dhis2UiStyle.css';
import {
  getPrograms,
  getAttributes,
  getAttributeDetails,
  isDuplicate,
  createTrackedEntity,
  checkOrgUnitInProgram,
  getOrgUnitDetail,
  generateAmrId,
  amrIdSqlView,
  getDataStoreNameSpace,
  getElementDetails,
  getOptionSetDetails,
  getMultipleElements,
  getMultipleAttributes,
} from '../components/api/API';
import { DropdownButton } from '@dhis2/ui-core/build/cjs/DropdownButton';

styleProps.styles.cardWide = Object.assign({}, styleProps.styles.card, {
  width: (styleProps.styles.card.width * 3) + (styleProps.styles.card.margin * 4),
});

class WHONETFileReader extends React.Component {
  constructor(props) {
    super(props);
    const d2 = props.d2;
    this.state = {
      csvfile: undefined,
      orgUnitField: "",
      d2: d2,
      loading: false,
      error: false,
      userOrgUnitName: props.orgUnit,
      fileFormatValue: '',
      isSettingModalOpen: false,
      isMultipleLabSettingModalOpen: false,
      userRoles: "",
      userAuthority: "",
      dataElements: [],
      attributes: [],
      counter: 0,
      emptyTrackedEntityPayload: false,
      dryRunResult: [],
      teiResponse: [],
      teiResponseString: "",
      mappingCsvData: [],
      duplicateStatus: false,
      trackedEntityInstance: "",
      dataStoreNamespaceElements: [],
      dataStoreNamespaceAttributes: [],
      dataStoreNamespaceOptions: [],
      settingsDropDown: "",
      feedBackToUser: undefined,
      disableImportButton: true,
      eventDate: "",
      requiredColumnsDe: [],
      requiredColumnsAtt: [],
      requiredColumnsDeValue: [],
      requiredColumnsAttValue: [],
      programAssignedStatus: false,
      requiredFieldsDSStatus: false,
      requiredFieldsDSMessage: ""

    };
    this.uploadCSVFile = this.uploadCSVFile.bind(this);

  }
  async componentWillMount() {
    /**
     * @param {currentUser} input
     * @returns Current user roles and organization unit 
     * {getPrograms()} returns all the dataElements under whonet program
     * {getAttributes()} returns all the attributes
     */

    let symbolValueCurrentUser = Object.getOwnPropertySymbols(this.props.d2.currentUser);
    let userRoles = this.props.d2.currentUser[symbolValueCurrentUser[0]];
    //let userOrgUnitId          = this.props.d2.currentUser[symbolValueCurrentUser[1]];
    // User authorities checking
    let symbolValueUserAuthorities = Object.getOwnPropertySymbols(this.props.d2.currentUser.authorities);
    let userAuthorities = this.props.d2.currentUser.authorities[symbolValueUserAuthorities[0]]
    let userAuthoritiesValues = userAuthorities.values();
    for (var authority = userAuthoritiesValues.next().value; authority = userAuthoritiesValues.next().value;) {
      if (authority === "ALL") {
        this.setState({
          userRoles: userRoles[0],
          userAuthority: authority,
        });
      }
    }

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

    // Get required fields from namespace
    await getDataStoreNameSpace("requiredFields").then((response) => {
      this.setState({
        eventDate : response.data.eventDate,      
        requiredColumnsDe : response.data.reqElements,      
        requiredColumnsAtt : response.data.reqAttributes,      
      }); 
    }).catch(error => this.setState({error: true}));

    // Required mapping message in alert box in window load
    this.requiredFields().then((value)=>{
      let requiredVal = value.map( (data, i) =>{
          if (typeof data.code == 'undefined') return <li key={i}> Mapping is required for {data.name}</li>
        });
      requiredVal.map((info)=>{
        if (typeof info !== 'undefined') {
          this.giveUserFeedback(requiredVal)
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

      // Missing elements alert
      await getMultipleElements(this.state.requiredColumnsDe).then((response) => {
        // deMessage = [...response.data.dataElements];
        deMessage.push(...response.data.dataElements);
        // deMessage = eventMessage.concat(response.data.dataElements);
        this.setState({
          disableImportButton: true,
          requiredColumnsDeValue: response.data.dataElements
        });      
      });
      // getMultipleElements = await
      //

      //Missing attributes alert
      await getMultipleAttributes(this.state.requiredColumnsAtt).then((response) => {
        messaageArr = deMessage.concat(response.data.trackedEntityAttributes);
        this.setState({
          disableImportButton: true,
          requiredColumnsAttValue: response.data.trackedEntityAttributes
        });      
      });

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

        this.giveUserFeedback( resultMissingColumn.map((value, index)=>{return <li key={index}> Missing {value.name} column in the selected file!</li>}) );
        this.setState({
          disableImportButton: true
        });

      } // End of missing columns check    
      
  }

  /**
  * Selected file format checking
  * Accept only .csv file format
  * Update setter 
  * @{generateCsvMappingTable} returns the parsed records of selected csv file
  */
  handleChangeFileUpload = (event) => {
    if (typeof event.target.files[0] !== 'undefined') {

      // Org unit assigned or not assigned
      this.setState({ feedBackToUser: '' });
      checkOrgUnitInProgram(this.props.orgUnitId).then(result => {
        if (typeof result == 'undefined') {
          // this.giveUserFeedback('File upload failed. Your selected org. unit was not assigned to this program.')
          this.setState({
            disableImportButton: true,
            programAssignedStatus: true,
          });
        }
      });

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

        if (!(typeof this.props.orgUnitId === 'undefined' || this.props.orgUnitId === null || this.props.orgUnitId === '')) {

          this.setState({
            disableImportButton: false,
            programAssignedStatus: false, // Enable the import button because the selected org unit is now assigned
          });
        }
        
        Papa.parse(event.target.files[0], {
          complete: this.generateCsvMappingTable,
          header: true
        });
        console.log("Your selected file: ", event.target.files[0].name);
      }  
    }
  }
  /**
  * @input the selected parsed csv file data
  * @{mappingCsvData} set CSV file columns
  */
  
  generateCsvMappingTable = (input) => {
    let csvData = input.data; 
    
    this.requiredImportFileHeader(csvData);

    this.setState({
      mappingCsvData: csvData[0]
    });

    
  }
  /**
  * Parse select csv file
  * CSV file header true
  * @returns loader true
  */
  importCSVFile = (input) => {
    const { csvfile } = this.state;
    Papa.parse(csvfile, {
      complete: this.uploadCSVFile,
      header: true
    });
    this.setState({
      loading: true,
    });
  };

  /**
  * @input {result}-selected parsed csv file
  * {orgUnitId}-get the selected org unit UID
  * {elementsFilterResult} returns the mapped elements
  * {attributesFilterResult} returns the mapped attributes
  */
  async uploadCSVFile(result) {
    let csvData = result.data;
    let elementId = "";
    let attributeId = "";
    let elementValue = "";
    let teiPayloadString = {};
    let orgUnitId = this.props.orgUnitId;
    let trackedEntityJson, eventDate;

    // Registration number
    let registrationNo = "";
    this.state.requiredColumnsAttValue.map((attribute)=>{
      registrationNo = attribute.code
    });
    
    if (this.props.importFileType === 'lab') {
      // Data store check
      await getDataStoreNameSpace(orgUnitId).then((response) => {
        this.setState({
          dataStoreNamespaceElements  : response.data.elements,
          dataStoreNamespaceAttributes: response.data.attributes,
          dataStoreNamespaceOptions   : response.data.options 
        });
      }).catch(error => this.setState({ error: true }));
      
    }
    const dataStoreNamespaceElements   = this.state.dataStoreNamespaceElements;
    const dataStoreNamespaceAttributes = this.state.dataStoreNamespaceAttributes;
    const dataStoreNamespaceOptions    = this.state.dataStoreNamespaceOptions;
    const csvLength = csvData.length;
    
    for (let i = 0; i < csvLength - 1; i++) {

      await (async (currentCsvData, duplicateStatus, currentIndex) => {

        let eventsPayload = {};
        let teiPayload = {};
        const csvObj = Object.entries(currentCsvData);
        let len = csvObj.length;

        for (let j = 0; j < len - 1; j++) {

          duplicateStatus = await (async ([columnName, columnValue], duplicate, index) => {
            let elementsFilterResult, attributesFilterResult, optionsFilterResult;
            
            let splittedValue  = columnName.split(","); // remove the C,2 or C,6 portion
            let csvColumnName  = splittedValue[0];

            // console.log({csvColumnName})
            if (this.props.importFileType === 'whonet') {

              // Elements filter from whonet code
              elementsFilterResult = this.state.dataElements.filter((element) => {
                return element.dataElement.code === csvColumnName;
              });
              if (elementsFilterResult.length > 0) {

                let matchResult = columnValue.match(/\//g);
                if (matchResult !== null && matchResult.length === 2) {
                  elementValue = formatDate(columnValue);
                } else {
                  elementValue = columnValue.replace(/[=><_]/gi, '');
                }
                elementId = elementsFilterResult[0].dataElement.id;
                eventsPayload[index] = {
                  "dataElement": elementId, 
                  "value": elementValue
                };  
              }
              if (csvColumnName === this.state.eventDate[0]) {
                eventDate = formatDate(columnValue.replace(/[=><_]/gi, ''));
              }
              // Attributes filter from whonet code
              attributesFilterResult = this.state.attributes.filter(function (attribute) {
                return attribute.code === csvColumnName;
              });
              
            } else { // Lab

              // Elements filter from data store
              elementsFilterResult = dataStoreNamespaceElements.filter((element) => {
                return element.mapCode === csvColumnName;
              });

              if (elementsFilterResult.length >= 1) {

                let matchResult = columnValue.match(/\//g);
                if (matchResult !== null && matchResult.length === 2) {
                  elementValue = formatDate(columnValue);
                } else {
                  elementValue = columnValue.replace(/[=><_]/gi, '');
                }
                elementId = elementsFilterResult[0].id;

                // Options checking for data elements
                await getElementDetails(elementId).then((deResponse) => {
                  
                  if(typeof deResponse!== 'undefined' && typeof deResponse.data.optionSet !== 'undefined'){

                    let updatedElId = deResponse.data.id;
                    let optionSetId = deResponse.data.optionSet;

                    // Get option sets with all options
                    getOptionSetDetails(optionSetId.id).then((osResponse) => {
                      if(typeof osResponse!== 'undefined'){

                        let optionsDetail = osResponse.data.options;
                        for (let i = 0; i < optionsDetail.length; i++) {

                    // Options map filter from data store 
                          optionsFilterResult = this.state.dataStoreNamespaceOptions.filter(function(option) {
                            return option.mapCode === columnValue;
                          });
                          if(optionsFilterResult.length >= 1){
                    
                    // Set option value as option name in the data element        
                            eventsPayload[index] = {
                              "dataElement": updatedElId, 
                              "value": optionsFilterResult[0].name
                            };  
                          }
                        }
                      } // end of osResponse
                    });                                  
                      
                  } else { // if this element has no option set, the value will be the excel/csv cell value
                      eventsPayload[index] = {
                        "dataElement": elementId, 
                        "value": elementValue
                      };
                    }  
                  
                }); // end await  
              }
              if (csvColumnName === this.state.eventDate[0]) {
                eventDate = formatDate(columnValue.replace(/[=><_]/gi, ''));
              }

              // Attributes filter from data store
              attributesFilterResult = dataStoreNamespaceAttributes.filter(function (attribute) {
                return attribute.mapCode === csvColumnName;
              });
            }
            // console.log({attributesFilterResult});
            if (attributesFilterResult.length >= 1) {
              let attributeValue;
              attributeId = attributesFilterResult[0].id;
              let matchResult = columnValue.match(/\//g);

              if (matchResult !== null && matchResult.length === 2) {
                attributeValue = formatDate(columnValue);
              }

              
              if (csvColumnName === registrationNo) {
                
                attributeValue = hash(columnValue.replace(/[=><_]/gi, ''));
              } else {
                attributeValue = columnValue.replace(/[=><_]/gi, '');
              }

              if (this.props.importFileType === 'lab') {
              // Options checking for attributes
                await getAttributeDetails(attributeId).then((attributeResponse) => {
                
                if(typeof attributeResponse !== 'undefined' && typeof attributeResponse.data.optionSet !== 'undefined'){

                  let attributeId = attributeResponse.data.id;
                  let optionSetId = attributeResponse.data.optionSet;
                  
                // Get option sets with all options
                  getOptionSetDetails(optionSetId.id).then((osResponse) => {
                    if(typeof osResponse !== 'undefined'){

                      let optionsDetail = osResponse.data.options;
                      for (let i = 0; i < optionsDetail.length; i++) {
                // Options map filter from data store 
                        optionsFilterResult = dataStoreNamespaceOptions.filter(function(option) {
                          return option.mapCode === columnValue;
                        });
                        if(optionsFilterResult.length >= 1){
                  
                // Set option value as option name in the attributes       
                          teiPayload[index] = {
                            "attribute": attributeId,
                            "value": optionsFilterResult[0].name
                          }; 
                        }
                      }
                    } // end of osResponse
                  });                                  
                    
                } else { // if this element has no option set, the value will be the excel/csv cell value
                  teiPayload[index] = {
                    "attribute": attributeId,
                    "value": attributeValue
                  };
                }  
                
                }); // end await

              } else { // If attributes are whonet
                teiPayload[index] = {
                    "attribute": attributeId,
                    "value": attributeValue
                  };
              }                

              // Duplicate Patient ID checking
              if (csvColumnName === registrationNo) {
                const result = await isDuplicate(hash(columnValue.replace(/[=><_]/gi, '')), orgUnitId, attributeId);
                duplicate[index] = result;
                if (typeof result !== 'undefined') {
                  this.setState({
                    duplicateStatus: result.result,
                    trackedEntityInstance: result.teiId,
                  });
                } else {
                  this.setState({
                    duplicateStatus: false,
                    trackedEntityInstance: null,
                  });
                }
              }
            }
            return duplicate;
          })(csvObj[j], {}, j);
        }

        /**
        * Generates AMR Id by the combination of OU code and a random integer value.
        * AmrID is unique for all lab for all record
        * If the newly generated amrid is matched with existing one the new one will be re-genreated and return for this record
        * @eventsPayloadUpdated returns updated json payload with dynamically generated amrid
        */
        let orgUnitCode;
        const getOrgUnitCode = await getOrgUnitDetail(orgUnitId);
        if (typeof getOrgUnitCode.data !== 'undefined') {
          orgUnitCode = getOrgUnitCode.data.code;
        } else {
          orgUnitCode = "";
        }
        const getAmrId = await amrIdSqlView(orgUnitId, orgUnitCode);
        let amrIdPayload = [{
          "dataElement": config.amrIdDataElement,
          "value": getAmrId
        }];
        let eventsPayloadUpdated = Object.assign(eventsPayload, amrIdPayload);

        /**
        * @{Object.keys(teiPayload)} checkes the json payload length
        * @{teiPayloadString} returns json payload with non-duplicate data to create new entity
        */

        if (Object.keys(teiPayload).length || Object.keys(eventsPayloadUpdated).length || !this.state.duplicateStatus) {

          teiPayloadString[currentIndex] = {
            "trackedEntityType": config.trackedEntityType,
            "orgUnit": orgUnitId,
            "attributes": Object.values(teiPayload),
            "enrollments": [{
              "orgUnit": orgUnitId,
              "program": config.programId,
              "enrollmentDate": eventDate,
              "incidentDate": eventDate,
              "events": [{
                "program": config.programId,
                "orgUnit": orgUnitId,
                "eventDate": eventDate,
                "status": "ACTIVE",
                "programStage": config.programStage,
                "dataValues": Object.values(eventsPayloadUpdated)
              }]
            }]
          };
        }
        /**
        * Create json payload for duplicate records
        * @param {duplicateStatus} status - checkes the existing enrollment 
        * @param {teiPayloadString} returns json payload with duplicate data to update exinsting enrollment
        */
        if (this.state.duplicateStatus) {
          teiPayloadString[currentIndex] = {
            "trackedEntityInstance": this.state.trackedEntityInstance,
            "trackedEntityType": config.trackedEntityType,
            "orgUnit": orgUnitId,
            "attributes": Object.values(teiPayload),
            "enrollments": [{
              "orgUnit": orgUnitId,
              "program": config.programId,
              "enrollmentDate": eventDate,
              "incidentDate": eventDate,
              "events": [{
                "program": config.programId,
                "orgUnit": orgUnitId,
                "eventDate": eventDate,
                "status": "ACTIVE",
                "programStage": config.programStage,
                "dataValues": Object.values(eventsPayloadUpdated)
              }]
            }]
          };
        }

        return duplicateStatus;
      })(csvData[i], {}, i);
    }

    /**
    * @{teiPayloadString}-contains the new and duplicate payload
    * @{trackedEntityJson} - returns the final json payload 
    */
    if ((typeof teiPayloadString !== 'undefined' || teiPayloadString !== null)) {
      
      trackedEntityJson = '{"trackedEntityInstances": ' + JSON.stringify(Object.entries(teiPayloadString).map(payload => payload[1])) + '}';
      console.log("Final teiPayloadString payload: ", trackedEntityJson);
    
    }

    if (typeof teiPayloadString !== 'undefined') {
      try {
        let responseData = await createTrackedEntity(trackedEntityJson);

        if (typeof responseData.data !== 'undefined') {
          this.setState({
            teiResponse: responseData.data,
            teiResponseString: JSON.stringify(responseData.data)
          });
          if (responseData.data.httpStatus === "OK") {
            this.giveUserFeedback('Your data was successfully uploaded')
            this.setState({
                loading: false
            });
          } else {
            this.giveUserFeedback('Unable to import WHONET file')
            this.setState({
              loading: false
            });
          }
        } else { // Axios return 409 or ERROR
          this.giveUserFeedback('Sorry! Unable to import whonet file. Please check the below log.');
          this.setState({
            teiResponse: responseData,
            teiResponseString: JSON.stringify(responseData)
          });
          this.setState({
            loading: false
          });
        }

      } catch (err) {
        if (typeof err !== 'undefined') {
          console.log(err)
        } else {
          console.log(err)
        }
      }

    } else {
      this.giveUserFeedback('The selected file is empty')
      this.setState({
        loading: false
      });
    }

  }

  /**
  * @input {field, value}-text field and value
  * @set {field}-value
  */
  onChangeValue = (field, value) => {
    this.setState({ [field]: value });
  };


  /**
  * {orgUnitId} returns selected org unit from left sidebar
  * {checkOrgUnitInProgram} returns whether the selected org unit assigned or not
  * If does not assign then prevent the file upload
  */
  fileUploadPreAlert = () => {
    let orgUnitId = this.props.orgUnitId;
    if (typeof orgUnitId === 'undefined' || orgUnitId === null || orgUnitId === '') {
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


  giveUserFeedback = (feedback) => {
    this.setState({
      feedBackToUser:
        <Modal small open>
          <Modal.Content> {feedback} </Modal.Content>
          <Modal.Actions><Button onClick={() => this.setState({ feedBackToUser: '' })}>Close</Button></Modal.Actions>
        </Modal>
    });
  }


  handleFileUpload = () => {
    this.setState({ feedBackToUser: '' });
    checkOrgUnitInProgram(this.props.orgUnitId).then(result => {
      if (typeof result !== 'undefined') {
        if (result.length > 0) {
          this.importCSVFile("import");
        }
      } 
      else {
        this.giveUserFeedback('File upload failed. Your selected org. unit was not assigned to this program')
      }
    });
  }


  render() {
    let importLoader, modal, userAuthority, teiResponse, logger;
    if (this.state.loading) {
      importLoader = <CircularLoader className='circularLoader'/>
    }
    /**
    * Default modal for Elements and Attributes settings
    * @settingType-whonet for super admin & all previleage level access
    */
    if (this.state.isSettingModalOpen) {
      modal = <MappingModal isModalOpen={this.state.isSettingModalOpen} handleModal={this.handleSettingModal} settingType="whonet" />
    }
    /**
    * Multi-lab setting
    * @settingType-multipleLab for all level of users access
    * @MappingModal- returns the modal for lab meta attributes setting 
    */
    if (this.state.isMultipleLabSettingModalOpen) {
      modal = <MappingModal isModalOpen={this.state.isMultipleLabSettingModalOpen} handleModal={this.handleMultipleLabSettingModal} settingType={config.settingType} orgUnitId={this.props.orgUnitId} orgUnitName={this.props.orgUnit} />
    }

    /**
    * CsvMappingColumns-bottom csv file header mapping
    * lab-returns individual lab setting data mapping
    * whonet-returns whonet code mapping
    * @returns-logger
    */
    if (Object.keys(this.state.mappingCsvData).length > 0 || Object.entries(this.state.mappingCsvData).length > 0) {
      if (this.props.importFileType === 'lab') {
        logger = <CsvMappingColumns csvData={this.state.mappingCsvData} attributes={this.state.attributes} settingType={this.props.importFileType} orgUnitId={this.props.orgUnitId} />;
      } else { 
        logger = <CsvMappingColumns csvData={this.state.mappingCsvData} dataElements={this.state.dataElements} attributes={this.state.attributes} settingType={this.props.importFileType} />;

      }
    }
    /**
    * ImportResults-import result summary & logger for json response preview
    * @returns-logger
    */
    if (Object.keys(this.state.teiResponse).length > 0 || Object.entries(this.state.teiResponse).length > 0) {
      teiResponse = <ImportResults teiResponse={this.state.teiResponse} />
      logger = <LoggerComponent teiResponse={this.state.teiResponse} teiResponseString={this.state.teiResponseString} />
    }

    // Program assigned status
    let programAssignedMessage = "";
    let requiredFieldsDSMessage = "";
    if(this.state.programAssignedStatus){
      programAssignedMessage = <p className="programNotAssign"> Sorry! Your selected org. unit was not assigned to this program.</p>
    }
    
    if(this.state.requiredFieldsDSStatus){
      console.log(this.state.requiredFieldsDSMessage);
      requiredFieldsDSMessage = this.state.requiredFieldsDSMessage;
    }


    return (
      <div className="whoNetController" >
        {this.state.feedBackToUser}
        {importLoader}
        <div>
          <Card className="fileUploadCard">

            <div className="fileUploadCardBottomContent">              
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
              <Button type='button' onClick={this.fileUploadPreAlert} primary disabled={this.state.disableImportButton}>Import</Button>
              
            </div>
            {programAssignedMessage}
            <p className='programNotAssign'>{requiredFieldsDSMessage}</p>
            {modal}
          </Card>
        </div>
        {teiResponse}
        {logger}

      </div>

    );
  }
}

export default WHONETFileReader;
