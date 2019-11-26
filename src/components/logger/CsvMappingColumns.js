import React from 'react';
import * as styleProps  from '../ui/Styles';
import * as config  from '../../config/Config';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { Card } from '@dhis2/ui-core';
import { 
    getDataStoreNameSpace,
} from '../api/API';
export default class CsvMappingColumns extends React.Component {
  constructor(props) {
    super(props);
    this.state = {  
      dsNamespaceElements: [],
      dsNamespaceAttributes: [],
      dsNamespaceOptions: [],
      open: props.isModalOpen,
      dsNameSpace: [],
      disableImportButton: true,
    }  
  }      
  async componentWillMount(){
    if(this.props.settingType === 'lab'){
      await getDataStoreNameSpace(this.props.orgUnitId).then((response) => {
        this.state.dsNameSpace.push(response.data.elements);
        this.state.dsNameSpace.push(response.data.attributes);
        this.state.dsNameSpace.push(response.data.options);
        this.setState({
          dsNamespaceElements  : response.data.elements,      
          dsNamespaceAttributes: response.data.attributes,      
          dsNamespaceOptions   :  response.data.options      
        }); 
      }).catch( error => {console.log("error: ", error)});
    }
  }
	render () {
    const classes = this.props;
    let mapCode, dataValues, loggerTitle, matchedColumns;
    let whonetFileData = Object.entries(this.props.csvData);    
    const {dsNameSpace} = this.state;   

    if(this.props.settingType === 'lab'){
      
      loggerTitle = "Lab file: The following mappings were found in the selected file";
      dataValues = whonetFileData.map( (value, key) =>{

        let splittedValue  = value[0].split(","); // remove the C,2 or C,6 portion
        let csvColumnName  = splittedValue[0];

        // console.log("Lab: ", csvColumnName);
        matchedColumns = dsNameSpace.map( (data, index ) =>{
          return data.map( (info, i) => {
            if (info.mapCode === csvColumnName) 
              return info.mapCode;                
          } )
        }) 
        // console.log({matchedColumns});
        return (
          <TableRow key={key}>
            <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
              {key+1}
            </TableCell>
            <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
              {csvColumnName}
            </TableCell>
            <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
              <p style={styleProps.styles.colors.color2}> {matchedColumns} </p>
            </TableCell>
          </TableRow>
        );
      }); // dataValues end 

    } else { 
      loggerTitle = "The following mappings were found in the selected file";  
      dataValues = whonetFileData.map( (value, key) =>{
        let splittedValue  = value[0].split(","); // remove the C,2 or C,6 portion
        let csvColumnName  = splittedValue[0];
        // console.log("Whonet: ", csvColumnName);

        let elFilterResult, attrFilterResult;        
          elFilterResult = this.props.dataElements.filter(function(element) {
            
            return element.dataElement.code === csvColumnName;                          
          });          

          attrFilterResult = this.props.attributes.filter(function(attribute) {
            return attribute.code === csvColumnName;                             
          });

          if(elFilterResult.length > 0){
            mapCode = elFilterResult[0].dataElement.code;
          } else if(attrFilterResult.length > 0){
            mapCode = attrFilterResult[0].code;
          } else {
            mapCode = "";
          }
          
        return (
            <TableRow key={key}>
              <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
                {key+1}
              </TableCell>
              <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
                {csvColumnName}
              </TableCell>
              <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
                <p style={styleProps.styles.colors.color2}> {mapCode} </p>
              </TableCell>
            </TableRow>
          )
      });
    }

    return (
      <div>
        <Card className="importPreview">
          <h3> {loggerTitle} </h3>
          {/*<p style={styleProps.styles.colors.color1}>{"Required Fields: " + config.requiredColumns} </p>*/}
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell style={styleProps.styles.tableHeader}> 
                <strong><p>File column nr</p></strong>
                </TableCell>
                <TableCell style={styleProps.styles.tableHeader}> 
                  <strong><p>File column header name </p></strong>
                </TableCell>
                <TableCell style={styleProps.styles.tableHeader}> 
                  <strong><p> DHIS2 data field name </p></strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>            
              {dataValues}             
            </TableBody>          
          </Table>         
        </Card>
      </div>
    );

    
	}
}