 export const baseUrl = `${process.env.REACT_APP_DHIS2_BASE_URL}/`;
 // export const baseUrl = 'http://amrtest.icmr.org.in/amrtest/'
// export const baseUrl = '../../../';
// export const baseUrl = 'http://localhost:8080/dhis/';

export const fetchOptions = {
  headers: { 
    Accept: 'application/json',
    'Content-Type': 'application/json',   
  }
};

export const programId      = "ywNJYaTUVRT";
export const optionGroupsId = "RdA1TnokkbH";
export const programStage   = "HrdLXTOGh8A";
export const trackedEntityInstance = "zYZHWSkfv10";
export const trackedEntityType     = "tOJvIFXsB5V";
export const dateColumn        = "DATE_DATA";
export const patientIdColumn   = "PATIENT_ID";
export const amrIdDataElement  = 'lIkk661BLpG';
export const metaAttributeName = "WHONET code";
export const metaAttributeUId  = "e5naGkHZ5qv";

export const requiredColumns   = [""];
// export const requiredColumns   = "Patient ID, Sample collection date, Organism name, Sample type";
export const settingType 	   = "lab"; // lab setting keyword
