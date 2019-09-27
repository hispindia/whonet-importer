import React from 'react';
import { connect } from 'react-redux';
import Papa from 'papaparse';
import CardText from 'material-ui/Card/CardText';
import { InputField } from '@dhis2/d2-ui-core';
import LinearProgress from '../components/ui/LinearProgress';
import MappingModal from '../components/settings/MappingModal';
import HelpModal from '../components/settings/HelpModal';
import * as config from '../config/Config';
import * as styleProps from '../components/ui/Styles';
import * as actionTypes from '../constants/actions.js';
import { formatDate } from '../components/helpers/DateFormat';
import { hash } from '../components/helpers/Hash';
import LoggerComponent from '../components/logger/LoggerComponent';
import CsvMappingColumns from '../components/logger/CsvMappingColumns';
import ImportResults from '../components/import-results/ImportResults';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import { Button, ButtonStrip, Menu, SplitButton, MenuItem, Card, Modal } from '@dhis2/ui-core';
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
  getDataStoreNameSpace,
  getElementDetails,
  getOptionDetails,
  getOptionSetDetails,
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
      isHelpModalOpen: false,
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
      importFileType: "",
      fileUploadBoxDisplayState: false,
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

    let self = this;
    await getPrograms().then((response) => {
      if (typeof response !== 'undefined') {
        self.setState({
          dataElements: response.data.programs[0].programStages[0].programStageDataElements
        });
      }

    });

    await getAttributes().then((response) => {
      if (typeof response !== 'undefined') {
        self.setState({
          attributes: response.data.trackedEntityAttributes
        });
      }
    });
  }
  handleChangeFileUpload = (event) => {

    /**
    * Selected file format checking
    * Accept only .csv file format
    * Update setter 
    */
    if (typeof event.target.files[0] !== 'undefined') {
      let fileType = this.state.importFileType; 
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
          this.setState({disableImportButton: false});
        }
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

  };
  /**
  * @input the selected parsed csv file data
  * @{mappingCsvData} set CSV file columns
  */
  generateCsvMappingTable = (input) => {
    let csvData = input.data;
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
    await getDataStoreNameSpace(orgUnitId).then((response) => {
      this.setState({
        dataStoreNamespaceElements  : response.data.elements,
        dataStoreNamespaceAttributes: response.data.attributes,
        dataStoreNamespaceOptions   : response.data.options 
      });
    }).catch(error => this.setState({ error: true }));
    const dataStoreNamespaceElements   = this.state.dataStoreNamespaceElements;
    const dataStoreNamespaceAttributes = this.state.dataStoreNamespaceAttributes;
    const dataStoreNamespaceOptions    = this.state.dataStoreNamespaceOptions;
    const csvLength = csvData.length
    for (let i = 0; i < csvLength - 1; i++) {

      await (async (currentCsvData, duplicateStatus, currentIndex) => {
        let eventsPayload = {};
        let teiPayload = {};
        const csvObj = Object.entries(currentCsvData);
        let len = csvObj.length;
        for (let j = 0; j < len - 1; j++) {

          duplicateStatus = await (async ([columnName, columnValue], duplicate, index) => {
            let elementsFilterResult, attributesFilterResult, optionsFilterResult;
            
            if (this.state.importFileType == 'whonet') {

              // Elements filter from whonet code
              elementsFilterResult = this.state.dataElements.filter((element) => {
                return element.dataElement.code === columnName;
              });
              if (elementsFilterResult.length > 0) {

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

                            let optionName = optionsDetail[i].name;
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
                if (columnName === config.dateColumn) {
                  eventDate = formatDate(columnValue.replace(/[=><_]/gi, ''));
                }

                attributesFilterResult = this.state.attributes.filter(function (attribute) {
                  return attribute.code === columnName;
                });

            } else {

              // Elements filter from data store
              elementsFilterResult = dataStoreNamespaceElements.filter((element) => {
                return element.mapCode === columnName;
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

                          let optionName = optionsDetail[i].name;
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
              if (columnName === config.dateColumn) {
                eventDate = formatDate(columnValue.replace(/[=><_]/gi, ''));
              }

              // Attributes filter from data store
              attributesFilterResult = this.state.dataStoreNamespaceAttributes.filter(function (attribute) {
                return attribute.mapCode === columnName;
              });
            }

            if (attributesFilterResult.length >= 1) {
              let attributeValue;
              attributeId = attributesFilterResult[0].id;
              let matchResult = columnValue.match(/\//g);

              if (matchResult !== null && matchResult.length === 2) {
                attributeValue = formatDate(columnValue);
              }

              if (columnName === config.patientIdColumn) {
                attributeValue = hash(columnValue.replace(/[=><_]/gi, ''));
              } else {
                attributeValue = columnValue.replace(/[=><_]/gi, '');
              }

            // Options checking for attributes
              await getAttributeDetails(attributeId).then((attributeResponse) => {
                
                if(typeof attributeResponse!== 'undefined' && typeof attributeResponse.data.optionSet !== 'undefined'){

                  let attributeId = attributeResponse.data.id;
                  let optionSetId = attributeResponse.data.optionSet;
                  
                // Get option sets with all options
                  getOptionSetDetails(optionSetId.id).then((osResponse) => {
                    if(typeof osResponse!== 'undefined'){

                      let optionsDetail = osResponse.data.options;
                      for (let i = 0; i < optionsDetail.length; i++) {

                        let optionName = optionsDetail[i].name;
                // Options map filter from data store 
                        optionsFilterResult = this.state.dataStoreNamespaceOptions.filter(function(option) {
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
              
              // Duplicate Patient ID checking

              if (columnName === config.patientIdColumn) {
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
        * @eventsPayloadUpdated returns updated json payload with dynamically generated amrid
        */
        let orgUnitCode;
        const getOrgUnitCode = await getOrgUnitDetail(orgUnitId);
        if (typeof getOrgUnitCode.data !== 'undefined') {
          orgUnitCode = getOrgUnitCode.data.code;
        } else {
          orgUnitCode = "";
        }
        const getAmrId = await generateAmrId(orgUnitId, orgUnitCode);
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
        * @{duplicateStatus} checkes the existing enrollment 
        * @{teiPayloadString} returns json payload with duplicate data to update exinsting enrollment
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
        let responseData = false;
        responseData = await createTrackedEntity(trackedEntityJson);

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
        } else {
          this.giveUserFeedback('Response data is undefined')
          this.setState({
            loading: false
          });
        }

      } catch (err) {
        if (typeof err !== 'undefined') {
          // console.log(err)
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


  /**
  * @returns isSettingModalOpen true
  */
  handleSettingModal = () => {
    this.setState({
      isSettingModalOpen: !this.state.isSettingModalOpen,
    });
  };

  /**
  * @returns isSettingModalOpen true
  */
  handleMultipleLabSettingModal = () => {
    if (this.props.orgUnitId.length === 0) {
      this.giveUserFeedback('Please select an organization unit')
    }
    else {
      this.setState({
        isMultipleLabSettingModalOpen: !this.state.isMultipleLabSettingModalOpen,
      });
    }
  };


  /**
  * @returns isHelpModalOpen true
  */
  handleHelpModal = () => {
    this.setState({
      isHelpModalOpen: !this.state.isHelpModalOpen,
    });
  };

  /**
  * importFileType - set multiLab or whonet file type
  * fileUploadBoxDisplayState - set true for file upload input box visibility
  */
  fileTypeSelection = (event) => {
    let target = event.target.value;
    if (target !== '') { 
      this.setState({
        importFileType: target,
        fileUploadBoxDisplayState: true
      });
    }
    
  };


  render() {
    // console.log("CTR: ", this.props.ctr);

    let importLoader, modal, userAuthority, teiResponse, logger, multipleLabModal, requiredColumns;
    /**
    * Linear Loader
    */
    if (this.state.loading) {
      importLoader = <LinearProgress />
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
    * @multipleLabModal- returns the modal for multiple lab meta attributes setting 
    */
    if (this.state.isMultipleLabSettingModalOpen) {
      modal = <MappingModal isModalOpen={this.state.isMultipleLabSettingModalOpen} handleModal={this.handleMultipleLabSettingModal} settingType={config.settingType} orgUnitId={this.props.orgUnitId} orgUnitName={this.props.orgUnit} />
    }

    /**
    * CsvMappingColumns-bottom csv file header mapping
    * multiLab-returns individual lab setting data mapping
    * whonet-returns whonet code mapping
    * @returns-logger
    */
    if (Object.keys(this.state.mappingCsvData).length > 0 || Object.entries(this.state.mappingCsvData).length > 0) {

      if (this.state.importFileType === 'multiLab') {

        logger = <CsvMappingColumns csvData={this.state.mappingCsvData} attributes={this.state.attributes} settingType={this.state.importFileType} orgUnitId={this.props.orgUnitId} />;

      } else { 

        logger = <CsvMappingColumns csvData={this.state.mappingCsvData} dataElements={this.state.dataElements} attributes={this.state.attributes} settingType={this.state.importFileType} />;
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
    /**
    * HelpModal-static data for the user guideline, how this mapping works
    * @returns-modal
    */
    if (this.state.isHelpModalOpen) {
      modal = <HelpModal isModalOpen={this.state.isHelpModalOpen} handleModal={this.handleHelpModal} />
    }
    /**
    * SettingsIcon-for default setting button
    * AddCircleRounded-for multiple lab setting button
    * ViewSupportIcon-for help modal
    * @returns-modal
    */
    if (this.state.userAuthority === 'ALL') {
      userAuthority = <MenuItem label="Global settings" onClick={this.handleSettingModal} />;
    }
    multipleLabModal = <MenuItem label="Settings for this org unit" onClick={this.handleMultipleLabSettingModal} />;
    let settingsDropDown =
      <DropdownButton
        small
        component={
          <Menu>
            {userAuthority}
            {multipleLabModal}
          </Menu>
        }>
        Mapping setup
      </DropdownButton>

    let helpModal = <Button small onClick={this.handleHelpModal} >Help</Button>

    return (
      <div className="whoNetController" >
        {this.state.feedBackToUser}
        <div>
          <Card className="fileUploadCard">

            <div className="fileUploadCardTopContent">
              <ButtonStrip>
                {settingsDropDown}
                {helpModal}
              </ButtonStrip>
            </div>
            <h4>Select file type </h4>
            <FormControl component="fieldset">
              <RadioGroup aria-label="position" name="position" value={this.value} onChange={this.fileTypeSelection} row>
                
                <FormControlLabel
                  name="whonet"
                  value="whonet"
                  control={<Radio color="primary" />}
                  label="Whonet file"
                  labelPlacement="end"
                />
                <FormControlLabel
                  name="multiLab"
                  value="multiLab"
                  control={<Radio color="primary" />}
                  label="Lab file"
                  labelPlacement="end"
                />
              </RadioGroup>
            </FormControl>
            {/*<Radio
              label="Whonet file"
              name="whonet"
              onChange={this.fileTypeSelection}
              value="whonet"
            />
            <Radio
              label="Lab file"
              name="multiLab"
              onChange={this.fileTypeSelection}
              value="multiLab"
            />*/}
            {this.state.fileUploadBoxDisplayState?
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
              
            </div> : null }
            {importLoader}
            {modal}
          </Card>
        </div>
        {teiResponse}
        {logger}

      </div>

    );
  }
}
/**
* Redux framework has introduced
* This below section is under development
*/
const mapStateToProps = state => {
  return {
    ctr: state.counter,
  };
};

const mapToDispatchToProps = (dispatch) => {
  return {
    fileUploadPreAlert: () => dispatch({ type: actionTypes.UPLOAD_PRE_ALERT }),
  };
}
export default connect(mapStateToProps, mapToDispatchToProps)(WHONETFileReader);
