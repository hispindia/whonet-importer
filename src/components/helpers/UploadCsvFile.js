import {
    
    getAttributeDetails,
    isDuplicate,
    createTrackedEntity,
    getOrgUnitDetail,
    amrIdSqlView,
    getDataStoreNameSpace,
    getElementDetails,
    getOptionSetDetails,
    getEventId,
    updateEvent,

  } from '../api/API';
  import { formatDate } from './DateFormat';
  import * as config from '../../config/Config';
  import { hash } from './Hash';
  
  

export const uploadCsvFile = async (result, orgUnitId, importFileType, requiredColumnsAttValue, dataElements, attributes, eventDate) => {

      let csvData = result.data;
      let elementId = "";
      let attributeId = "";
      let eventDateValue = "";
      let elementValue = "";
      let teiPayloadString = {};
      let trackedEntityJson;
      let dataStoreNamespaceElements   = [];
      let dataStoreNamespaceAttributes = [];
      let dataStoreNamespaceOptions    = [];
      let duplicateRecordStatus = false;
      let eventPayloadString = {};

      
      if (importFileType === 'lab') {
        // Data store check
        await getDataStoreNameSpace(orgUnitId).then((response) => {
          dataStoreNamespaceElements   =  response.data.elements;
          dataStoreNamespaceAttributes =  response.data.attributes;
          dataStoreNamespaceOptions    = response.data.options;
        }).catch(error => {
          return { success: null, error: "Could not find organisation unit"} }
        );
      }

      // dataStoreNamespaceElements   = this.state.dataStoreNamespaceElements;
      // dataStoreNamespaceAttributes = this.state.dataStoreNamespaceAttributes;
      // dataStoreNamespaceOptions    = this.state.dataStoreNamespaceOptions;
      const csvLength = csvData.length;

      // Registration number
      let registrationNo = "";
      requiredColumnsAttValue.map((attribute)=>{
        registrationNo = attribute.code
      });

      /*let dataElements = [];
      await getPrograms().then((response) => {
          if (typeof response !== 'undefined') {
            dataElements = response.data.programs[0].programStages[0].programStageDataElements
          }
      });

      let attributes = [];
      await getAttributes().then((response) => {
        if (typeof response !== 'undefined') {
            attributes: response.data.trackedEntityAttributes
        }
      });*/

      // AmrId generate
      let orgUnitCode;
      const getOrgUnitCode = await getOrgUnitDetail(orgUnitId);
      if (typeof getOrgUnitCode.data !== 'undefined') {
        orgUnitCode = getOrgUnitCode.data.code;
      } else {
        orgUnitCode = "";
      }
      const getAmrId = await amrIdSqlView(orgUnitId, orgUnitCode); 

      let trackedEntityInstance; 

  for (let i = 0; i < csvData.length; i++) {

            await (async (currentCsvData, duplicateStatus, currentIndex) => {
                let eventsPayload = {};
                let teiPayload    = {};
                const csvObj      = Object.entries(currentCsvData);
                let len           = csvObj.length;

            for (let j = 0; j < len - 1; j++) {
              duplicateStatus = await (async ([columnName, columnValue], duplicate, index) => {
                
                let elementsFilterResult, attributesFilterResult, optionsFilterResult;
                let splittedValue  = columnName.split(","); // remove the C,2 or C,6 portion
                let csvColumnName  = splittedValue[0];
                if (importFileType === 'whonet') {
                  
                  if (csvColumnName === eventDate) {                    
                    eventDateValue = formatDate(columnValue.replace(/[=><_]/gi, ''));
                  }
                  


                  // Elements filter from whonet code
                  elementsFilterResult = dataElements.find((element) => {
                    return element.dataElement.code === csvColumnName;
                  });

                  if (elementsFilterResult && Object.keys(elementsFilterResult).length > 0) {

    
                    let matchResult = columnValue.match(/\//g);
                    if (matchResult !== null && matchResult.length === 2) {
                      elementValue = formatDate(columnValue);
                    } else {
                      elementValue = columnValue.replace(/[=><_]/gi, '');
                    }
                    elementId = elementsFilterResult.dataElement.id;
                    eventsPayload[index] = {
                      "dataElement": elementId, 
                      "value": elementValue
                    }; 

                  }

                  // Attributes filter from whonet code
                  
                  attributesFilterResult = attributes.find(function (attribute) {
                    if (attribute.code != undefined) {
                      return attribute.code.toUpperCase() === csvColumnName.toUpperCase();
                    }
                    else {
                      attribute.code === csvColumnName;
                    }
                  });
    
                } else { // Lab
    
                  // Elements filter from data store
                  elementsFilterResult = dataStoreNamespaceElements.find((element) => {
                    return element.mapCode === csvColumnName;
                  });
                    console.log(  " 1 - " + elementId + " - " + elementValue );
                  if (elementsFilterResult && Object.keys(elementsFilterResult).length >= 1) {

                    console.log( Object.keys(elementsFilterResult).length + " 2 - " + elementId + " - " + elementValue );
                    let matchResult = columnValue.match(/\//g);
                    if (matchResult !== null && matchResult.length === 2) {
                      elementValue = formatDate(columnValue);
                    } else {
                      elementValue = columnValue.replace(/[=><_]/gi, '');
                    }
                    elementId = elementsFilterResult.id;
                    console.log(  " 3 - " + elementId + " - " + elementValue );
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
    
                              // let optionName = optionsDetail[i].name;
                      // Options map filter from data store 
                              optionsFilterResult = dataStoreNamespaceOptions.filter(function(option) {
                                return option.mapCode === columnValue;
                              });

                                console.log(Object.keys(optionsFilterResult).length  + " 4 - " + updatedElId + " - " + optionsFilterResult[0].name);
                              if( optionsFilterResult && Object.keys(optionsFilterResult).length >= 1){
                        
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
                  if (csvColumnName === eventDate) {
                    eventDateValue = formatDate(columnValue.replace(/[=><_]/gi, ''));
                  }
    
                  // Attributes filter from data store
                  attributesFilterResult = dataStoreNamespaceAttributes.find(function (attribute) {
                    return attribute.mapCode === csvColumnName;
                  });
                }
                
                if (attributesFilterResult && Object.keys(attributesFilterResult).length >= 1) {

                  let attributeValue;
                  attributeId = attributesFilterResult.id;
                  let matchResult = columnValue.match(/\//g);
    
                  if (matchResult !== null && matchResult.length === 2) {
                    attributeValue = formatDate(columnValue);
                  }
                  
                  if (csvColumnName === registrationNo) {                
                    attributeValue = hash(columnValue.replace(/[=><_]/gi, ''));
                  } else {
                    attributeValue = columnValue.replace(/[=><_]/gi, '');
                  }
    
                  if (importFileType === 'lab') {
                  // Options checking for attributes
                    await getAttributeDetails(attributeId).then((attributeResponse) => {
                    
                    if(typeof attributeResponse !== 'undefined' && typeof attributeResponse.data.optionSet !== 'undefined'){
    
                      let attributeId = attributeResponse.data.id;
                      let optionSetId = attributeResponse.data.optionSet;
                      
                    // Get option sets with all options
                      getOptionSetDetails(optionSetId.id).then((osResponse) => {
                        if(typeof osResponse!== 'undefined'){
    
                          let optionsDetail = osResponse.data.options;
                          for (let i = 0; i < optionsDetail.length; i++) {
    
                            // let optionName = optionsDetail[i].name;
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
                    if (typeof result !== 'undefined' && result.result >= 1) {
                      duplicateRecordStatus = true;
                      trackedEntityInstance = result.teiId;
                    } else {
                      duplicateRecordStatus = false;
                      trackedEntityInstance = null; 
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
            
            let amrIdPayload = [{
              "dataElement": config.amrIdDataElement,
              "value": getAmrId
            }];
            let eventsPayloadUpdated = Object.assign(eventsPayload, amrIdPayload);
    
    
            /**
            * @{Object.keys(teiPayload)} checkes the json payload length
            * @{teiPayloadString} returns json payload with non-duplicate data to create new entity
            */
            if (!duplicateRecordStatus) {
              if (Object.keys(teiPayload).length || Object.keys(eventsPayloadUpdated).length) {    
                teiPayloadString[currentIndex] = {
                  "trackedEntityType": config.trackedEntityType,
                  "orgUnit": orgUnitId,
                  "attributes": Object.values(teiPayload),
                  "enrollments": [{
                    "orgUnit": orgUnitId,
                    "program": config.programId,
                    "enrollmentDate": eventDateValue,
                    "incidentDate": eventDateValue,
                    "events": [{
                      "program": config.programId,
                      "orgUnit": orgUnitId,
                      "eventDate": eventDateValue,
                      "status": "ACTIVE",
                      "programStage": config.programStage,
                      "dataValues": Object.values(eventsPayloadUpdated)
                    }]
                  }]
                };
              }
            }
            
            /**
            * @{duplicateStatus} checkes the existing enrollment 
            * @{teiPayloadString} returns json payload with duplicate data to update exinsting enrollment
            */
            if (duplicateRecordStatus) {
              // Get event id to update duplicate

              const eventId = await getEventId(config.programId, orgUnitId,trackedEntityInstance);

              /*teiPayloadString[currentIndex] = {
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
              };*/
              eventPayloadString[currentIndex] = {
                
                  "program": config.programId,
                  "orgUnit": orgUnitId,
                  "event": eventId,
                  "eventDate": eventDateValue,
                  "status": "ACTIVE",
                  "programStage": config.programStage,
                  "dataValues": Object.values(eventsPayloadUpdated)
                
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

              let finalEventUpdatePayload = '{"events": ' +JSON.stringify(Object.entries(eventPayloadString).map(payload => payload[1]))+ '}';

              console.log("Tracker Payload to send mapped data", trackedEntityJson);
              console.log("EVENTS Payload to send mapped data",finalEventUpdatePayload)
              let teiResponseData   = await createTrackedEntity(trackedEntityJson);
              let eventResponseData = await updateEvent(finalEventUpdatePayload);

              if (typeof teiResponseData.data !== 'undefined' && eventResponseData.data !== 'undefined') {  
                if (eventResponseData.status === 'ERROR' && eventResponseData.ignored > 0) {
                  return { 
                    success: false, 
                    error: eventResponseData.importSummaries[0].conflicts[0].value,
                    teiResponse: teiResponseData.data.response,
                    eventResponse: eventResponseData.importSummaries[0],
                  }

                 }
                  else if (teiResponseData.data.httpStatus === "OK") {

                      return { 
                        success: "Your data was successfully uploaded", 
                        error: false, 
                        teiResponse: teiResponseData.data.response,
                        eventResponse: eventResponseData.data.response,
                        /*teiResponseString: JSON.stringify(teiResponseData.data.response),
                        eventResponseString: JSON.stringify(eventResponseData.data.response),*/
                      } 
                } 
                else if (teiResponseData.status == "500") {
                  let errormsj = teiResponseData.data.message;

                      return { 
                        success:errormsj, 
                        error: true, 
                        teiResponse: teiResponseData.data,
                        eventResponse: eventResponseData.data,
                        /*teiResponseString: JSON.stringify(teiResponseData.data.response),
                        eventResponseString: JSON.stringify(eventResponseData.data.response),*/
                      } 
                  }
                  else {
                      return { success: false, error: "Unable to import Whonet file"} 
                  }
              } else if(teiResponseData.status === 'ERROR' && teiResponseData.ignored > 0){
                  
                  return { 
                    success: false, 
                    error: "Unable to import Whonet file. Conflict in updating!",
                    teiResponse: teiResponseData.importSummaries[0],
                    eventResponse: eventResponseData.data.response,
                  }
              } else { // Axios return 409 or ERROR
                return { success: false, error: "Unable to import Whonet file"}                     
              }
            } catch (err) {
              console.log(err)
          }
        } 
        else {
            return { success: false, error: "The selected file is empty"}             
        }
    
      
}