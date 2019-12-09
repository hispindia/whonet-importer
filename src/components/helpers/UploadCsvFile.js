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
  import { formatDate } from './DateFormat';
  import * as config from '../../config/Config';
  import { hash } from './Hash';
  
  

export const uploadCsvFile = async (result, orgUnitId, importFileType) => {
        let csvData = result.data;
        let elementId = "";
        let attributeId = "";
        let elementValue = "";
        let teiPayloadString = {};
        let trackedEntityJson, eventDate;
        let dataStoreNamespaceElements   = [];
        let dataStoreNamespaceAttributes = [];
        let dataStoreNamespaceOptions    = [];
        let duplicateStatus = false;
    
        
        if (importFileType === 'multiLab') {
          // Data store check
          await getDataStoreNameSpace(orgUnitId).then((response) => {
              dataStoreNamespaceElements =  response.data.elements;
              dataStoreNamespaceAttributes =  response.data.attributes;
              dataStoreNamespaceOptions = response.data.options;
          }).catch(error => {
              return { success: null, error: "Could not find organisation unit"} }
            );
        }
        let dataElements = []
        await getPrograms().then((response) => {
            if (typeof response !== 'undefined') {
                dataElements = response.data.programs[0].programStages[0].programStageDataElements
            }
        });

        let attributes = []
        await getAttributes().then((response) => {
            if (typeof response !== 'undefined') {
                attributes: response.data.trackedEntityAttributes
            }
          });

        for (let i = 0; i < csvData.length - 1; i++) {
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
                if (importFileType == 'whonet') {
                  // Elements filter from whonet code
                  elementsFilterResult = dataElements.filter((element) => {
                    return element.dataElement.code === csvColumnName;
                  });
                  if (elementsFilterResult.length > 0) {
    
                    let matchResult = columnValue.match(/\//g);
                    if (matchResult !== null && matchResult.length === 2) {
                      elementValue = formatDate(columnValue);
                    } else {
                      elementValue = columnValue.replace(/[=><_]/gi, '');
                    }
                    elementId = elementsFilterResult[0].id;
                    eventsPayload[index] = {
                      "dataElement": elementId, 
                      "value": elementValue
                    };  
                  }
                  if (csvColumnName === config.dateColumn) {
                    eventDate = formatDate(columnValue.replace(/[=><_]/gi, ''));
                  }
                  // Attributes filter from whonet code
                  attributesFilterResult = attributes.filter(function (attribute) {
                    return attribute.code === csvColumnName;
                  });
    
                } else {
    
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
    
                              let optionName = optionsDetail[i].name;
                      // Options map filter from data store 
                              optionsFilterResult = dataStoreNamespaceOptions.filter(function(option) {
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
                  if (csvColumnName === config.dateColumn) {
                    eventDate = formatDate(columnValue.replace(/[=><_]/gi, ''));
                  }
    
                  // Attributes filter from data store
                  attributesFilterResult = dataStoreNamespaceAttributes.filter(function (attribute) {
                    return attribute.mapCode === csvColumnName;
                  });
                }
    
                if (attributesFilterResult.length >= 1) {
                  let attributeValue;
                  attributeId = attributesFilterResult[0].id;
                  let matchResult = columnValue.match(/\//g);
    
                  if (matchResult !== null && matchResult.length === 2) {
                    attributeValue = formatDate(columnValue);
                  }
    
                  if (csvColumnName === config.patientIdColumn) {
                    attributeValue = hash(columnValue.replace(/[=><_]/gi, ''));
                  } else {
                    attributeValue = columnValue.replace(/[=><_]/gi, '');
                  }
    
                  if (importFileType == 'multiLab') {
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
                  if (csvColumnName === config.patientIdColumn) {
                    const result = await isDuplicate(hash(columnValue.replace(/[=><_]/gi, '')), orgUnitId, attributeId);
                    duplicate[index] = result;
                    if (typeof result !== 'undefined') {
                      duplicateStatus = result
                    } else {
                      duplicateStatus = false 
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
    
            if (Object.keys(teiPayload).length || Object.keys(eventsPayloadUpdated).length || !duplicateStatus) {
    
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
            if (duplicateStatus) {
              teiPayloadString[currentIndex] = {
                "trackedEntityInstance": duplicateStatus.teiId,
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
                    if (responseData.data.httpStatus === "OK") {
                        return { success: "Your data was successfully uploaded", error: false} 
                    } 
                    else {
                        return { success: false, error: "Unable to import Whonet file"} 
                    }
                } 
                else { // Axios return 409 or ERROR
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